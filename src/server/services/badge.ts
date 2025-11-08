import { AppDataSource } from "@/db";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { ChildStat } from "@/db/entities/ChildStat";
import { ParentStat } from "@/db/entities/ParentStat";
import { Badge } from "@/db/entities/Badge";
import { ClientBadge } from "@/db/entities/ClientBadge";
import { In, IsNull, Not } from "typeorm";
import { BadgeCriteria } from "@/helpers/types";
import { logger } from "@/lib/logger";
import { Route } from "@/db/entities/Route";

export type Stat = {
    childId?: string;
    parentId?: string;
    totalDistanceMeters: number;
    totalCaloriesBurned: number;
    totalParticipations: number;
    totalDifferentWeatherTypes: number;
    totalPointsEarned: number;
    actualStreak?: number;
};


export async function awardBadgesAfterActivity(activityId: string) {
    try {
        const activity = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activityId },
            relations: {
                childStations: true,
                parentStations: true
            }
        });

        const childIds = activity?.childStations.map(cs => cs.childId) || [];
        if (childIds.length === 0) {
            return;
        }

        const childrenStats: Stat[] = [];
        for (const childId of childIds) {
            const childDBStats = await AppDataSource.getRepository(ChildStat).find({
                where: { childId: childId },
                relations: {
                    activitySession: true
                }
            });

            const weatherSet = new Set<string>();
            for (const cs of childDBStats) {
                const wt = cs.activitySession?.weatherType;
                if (wt != null) {
                    weatherSet.add(String(wt));
                }
            }

            const stat: Stat = {
                childId: childId,
                totalDistanceMeters: childDBStats.reduce((sum, cs) => sum + (cs.distanceMeters || 0), 0),
                totalCaloriesBurned: childDBStats.reduce((sum, cs) => sum + (cs.caloriesBurned || 0), 0),
                totalParticipations: childDBStats.length,
                totalDifferentWeatherTypes: weatherSet.size,
                totalPointsEarned: childDBStats.reduce((sum, cs) => sum + (cs.pointsEarned || 0), 0),
            };
            childrenStats.push(stat);
        }

        const parentsIds = activity?.parentStations.map(ps => ps.parentId) || [];
        let parentsStats: Stat[] = [];
        for (const pid of parentsIds) {
            const parentDBStats = await AppDataSource.getRepository(ParentStat).find({
                where: { parentId: pid }
            });
            const enrichedParentStats: ParentStat[] = [];
            for (const ps of parentDBStats) {
                const childStatId = ps.childStatId;
                if (!childStatId) {
                    continue;
                }
                const childStat = await AppDataSource.getRepository(ChildStat).findOne({
                    where: { id: childStatId },
                    relations: { activitySession: true }
                });
                if (!childStat) {
                    continue;
                }
                ps.childStat = childStat;
                enrichedParentStats.push(ps);
            }

            const activitySessionMap: Map<string, ParentStat[]> = new Map();
            for (const ps of enrichedParentStats) {
                const activitySessionId = ps.childStat.activitySessionId;
                if (!activitySessionMap.has(activitySessionId)) {
                    activitySessionMap.set(activitySessionId, []);
                }
                activitySessionMap.get(activitySessionId)!.push(ps);
            }

            const activityToChildStat: Map<string, ChildStat> = new Map();
            for (const [activitySessionId, pStats] of activitySessionMap) {
                let bestChildStat: ChildStat | null = null;
                for (const ps of pStats) {
                    const cs = ps.childStat;
                    if (!cs) continue;
                    if (bestChildStat == null || (cs.pointsEarned ?? 0) > (bestChildStat.pointsEarned ?? 0)) {
                        bestChildStat = cs;
                    }
                }
                if (bestChildStat) {
                    activityToChildStat.set(activitySessionId, bestChildStat);
                }
            }

            const stat: Stat = {
                parentId: pid,
                totalDistanceMeters: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.distanceMeters || 0), 0),
                totalCaloriesBurned: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.caloriesBurned || 0), 0),
                totalParticipations: activityToChildStat.size,
                totalDifferentWeatherTypes: Array.from(activityToChildStat.values()).reduce((set, cs) => {
                    const wt = cs.activitySession?.weatherType;
                    if (wt != null) {
                        set.add(String(wt));
                    }
                    return set;
                }, new Set<string>()).size,
                totalPointsEarned: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.pointsEarned || 0), 0),
            };

            parentsStats.push(stat);
        }

        const { childStreakMap, parentStreakMap } = await checkStreakForClient(childIds, parentsIds);

        for (const cs of childrenStats) {
            const streak = childStreakMap.get(cs.childId!);
            if (streak !== undefined) {
                cs.actualStreak = streak;
            }
        }
        for (const ps of parentsStats) {
            const streak = parentStreakMap.get(ps.parentId!);
            if (streak !== undefined) {
                ps.actualStreak = streak;
            }
        }

        const badges = await AppDataSource.getRepository(Badge).find();

        await evaluateAndAwardBadges(badges, childrenStats, parentsStats);

    }
    catch (error) {
        logger.error("Error awarding badges:", error);
    }
}

export function hasEnoughForBadge(stat: Stat, badge: Badge): boolean {
    switch (badge.criteria as BadgeCriteria) {
        case BadgeCriteria.STREAK:
            return (stat.actualStreak || 0) >= badge.valueneeded;

        case BadgeCriteria.DISTANCE:
            return stat.totalDistanceMeters >= (badge.valueneeded * 1000);

        case BadgeCriteria.CALORIES:
            return stat.totalCaloriesBurned >= badge.valueneeded;

        case BadgeCriteria.WEATHER:
            return stat.totalDifferentWeatherTypes >= badge.valueneeded;

        case BadgeCriteria.POINTS:
            return stat.totalPointsEarned >= badge.valueneeded;

        case BadgeCriteria.PARTICIPATION:
            return stat.totalParticipations >= badge.valueneeded;

        case BadgeCriteria.SPECIAL:
            return false;
            
        case BadgeCriteria.LEADERBOARD:
            return false;

        default:
            return false;
    }
}

export async function evaluateAndAwardBadges(badges: Badge[], childStats: Stat[], parentStats: Stat[]) {
    const toAward: { badgeId: string; childId?: string; parentId?: string }[] = [];

    for (const cs of childStats) {
        for (const badge of badges) {
            if (hasEnoughForBadge(cs, badge)) {
                toAward.push({ badgeId: badge.id, childId: cs.childId });
            }
        }
    }

    for (const ps of parentStats) {
        for (const badge of badges) {
            if (hasEnoughForBadge(ps, badge)) {
                toAward.push({ badgeId: badge.id, parentId: ps.parentId });
            }
        }
    }

    for (const award of toAward) {
        const existing = await AppDataSource.getRepository(ClientBadge).findOne({
            where: {
                badgeId: award.badgeId,
                childId: award.childId ? award.childId : IsNull(),
                parentId: award.parentId ? award.parentId : IsNull(),
            }
        });
        if (!existing) {
            const clientBadge = new ClientBadge();
            clientBadge.badgeId = award.badgeId;
            if (award.childId) {
                clientBadge.childId = award.childId;
            }
            if (award.parentId) {
                clientBadge.parentId = award.parentId;
            }
            await AppDataSource.getRepository(ClientBadge).save(clientBadge);
        }
    }
}

export async function checkStreakForClient(childId: string[] | null, parentId: string[] | null) {
    try {
        if (!childId && !parentId) {
            throw new Error("Either childId or parentId must be provided");
        }

        const routeIds = await AppDataSource.getRepository(Route).find().then(routes => routes.map(r => r.id));

        let activitiesByRoute: Map<number, ActivitySession[]> = new Map();

        let allActivities = await AppDataSource.getRepository(ActivitySession).find({
            where: { finishedAt: Not(IsNull()) },
            relations: {
                childStations: true,
                parentStations: true
            },
            order: {
                finishedAt: "DESC"
            }
        });

        let activitiesOrderedByRouteId: Map<string, ActivitySession[]> = new Map();

        for (const routeId of routeIds) {
            activitiesOrderedByRouteId.set(routeId, []);
        }

        for (const activity of allActivities) {
            const routeId = activity.routeId;
            if (activitiesOrderedByRouteId.has(routeId)) {
                activitiesOrderedByRouteId.get(routeId)!.push(activity);
            }
        }

        const leastLength = Math.min(...Array.from(activitiesOrderedByRouteId.values()).map(arr => arr.length));
        for (let i = 0; i < leastLength; i++) {
            activitiesByRoute.set(i, []);
        }

        for (let i = 0; i < leastLength; i++) {
            for (const routeId of routeIds) {
                const activitiesForRoute = activitiesOrderedByRouteId.get(routeId);
                const activityNumberi = activitiesForRoute ? activitiesForRoute[i] : undefined;
                if (activityNumberi !== undefined) {
                    activitiesByRoute.get(i)!.push(activityNumberi);
                }
            }
        }


        let childStreakMap: Map<string, number> = new Map();
        let parentStreakMap: Map<string, number> = new Map();

        for (const entryChildId of childId || []) {
            childStreakMap.set(entryChildId, 1);
            for (const [_, activities] of activitiesByRoute) {
                let combo = 0;
                for (const activity of activities) {
                    const participated = activity.childStations.some(cs => cs.childId === entryChildId);
                    if (!participated) {
                        break;
                    } else {
                        combo += 1;
                        childStreakMap.set(entryChildId, combo);
                    }
                }
            }
        }

        for (const entryParentId of parentId || []) {
            parentStreakMap.set(entryParentId, 1);
            for (const [_, activities] of activitiesByRoute) {
                let combo = 1;
                for (const activity of activities) {
                    const participated = activity.parentStations.some(ps => ps.parentId === entryParentId);
                    if (!participated) {
                        break;
                    } else {
                        combo += 1;
                        parentStreakMap.set(entryParentId, combo);
                    }
                }
            }
        }

        return { childStreakMap, parentStreakMap };
    } catch (error) {
        logger.error("Error checking streak for client:", error);
        return { childStreakMap: new Map(), parentStreakMap: new Map() };
    }
}
