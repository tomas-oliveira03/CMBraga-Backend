import { AppDataSource } from "@/db";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { ChildStat } from "@/db/entities/ChildStat";
import { ParentStat } from "@/db/entities/ParentStat";
import { Badge } from "@/db/entities/Badge";
import { ClientBadge } from "@/db/entities/ClientBadge";
import { In, IsNull, Not } from "typeorm";
import { BadgeCriteria } from "@/helpers/types";
import { logger } from "@/lib/logger";

export type Stat = {
    childId?: string;
    parentId?: string;
    totalDistanceMeters: number;
    totalCaloriesBurned: number;
    totalParticipations: number;
    totalDifferentWeatherTypes: number;
    totalPointsEarned: number;
};


export async function awardBadgesAfterActivity(activityId: string) {
    try{
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
            console.log("Processing parent:", pid);
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

            console.log("Parent stat computed:", stat);

            parentsStats.push(stat);
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
            return false;

        case BadgeCriteria.DISTANCE:
            return stat.totalDistanceMeters >= (badge.valueneeded * 1000);

        case BadgeCriteria.CALORIES:
            return stat.totalCaloriesBurned >= badge.valueneeded;

        case BadgeCriteria.WEATHER:
            return stat.totalDifferentWeatherTypes >= badge.valueneeded;

        case BadgeCriteria.POINTS:
            return stat.totalPointsEarned >= badge.valueneeded;

        case BadgeCriteria.LEADERBOARD:
            return false;

        case BadgeCriteria.PARTICIPATION:
            return stat.totalParticipations >= badge.valueneeded;

        case BadgeCriteria.SPECIAL:
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