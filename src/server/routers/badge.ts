import express, { Request, Response } from "express";
import { AppDataSource } from "@/db";
import { IsNull } from "typeorm";
import { Badge } from "@/db/entities/Badge";
import { ClientBadge } from "@/db/entities/ClientBadge";
import { ParentChild } from "@/db/entities/ParentChild";
import { z } from "zod";
import { authenticate, authorize } from "@/server/middleware/auth";
import { UserRole } from "@/helpers/types";
import { UpdateBadgeSchema, CreateBadgeSchema } from "../schemas/badge";
import { ParentStat } from "@/db/entities/ParentStat";
import { ChildStat } from "@/db/entities/ChildStat";
import { BadgeCriteria } from "@/helpers/types";
import multer from "multer";
import { isValidImageFile } from "@/helpers/storage";
import { uploadImageBuffer, deleteImageSafe } from "../services/cloud";
import { getStreakForClient } from "../services/badge";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const badges = await AppDataSource.getRepository(Badge).find();
        return res.status(200).json(badges);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const badge = await AppDataSource.getRepository(Badge).findOne({ where: { id: req.params.id } });
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        return res.status(200).json(badge);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateBadgeSchema.parse(req.body);

        if (req.file) {
            if (!isValidImageFile(req.file)) {
                return res.status(400).json({ message: "Invalid image file" });
            }
            const imageUrl = await uploadImageBuffer(req.file.buffer, "badge-picture", "badges");
            validatedData.imageUrl = imageUrl;
        } else {
            return res.status(400).json({ message: "Badge image is required" });
        }

        // Check if a badge with the same name already exists
        const existingBadge = await AppDataSource.getRepository(Badge).findOne({ where: { name: validatedData.name } });
        if (existingBadge) {
            return res.status(400).json({ message: "Badge name must be unique" });
        }

        const result = await AppDataSource.getRepository(Badge).insert(validatedData);
        const newId = result.identifiers?.[0]?.id ?? null;
        return res.status(201).json({ message: "Badge created successfully", id: newId });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validatedData = UpdateBadgeSchema.parse(req.body);

        const existingBadge = await AppDataSource.getRepository(Badge).findOne({ where: { name: validatedData.name } });
        const currentBadge = await AppDataSource.getRepository(Badge).findOne({ where: { id: req.params.id } });

        if (!currentBadge) {
            return res.status(404).json({ message: "Badge not found" });
        }

        if (existingBadge && existingBadge.id !== currentBadge.id) {
            return res.status(400).json({ message: "Badge name must be unique" });
        }

        await AppDataSource.getRepository(Badge).update(currentBadge.id, validatedData);
        return res.status(200).json({ message: "Badge updated successfully", id: currentBadge.id });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.delete('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const badge = await AppDataSource.getRepository(Badge).findOne({ where: { id: req.params.id } });
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }

        const referencingClientBadge = await AppDataSource.getRepository(ClientBadge).findOne({ where: { badgeId: badge.id } });
        if (referencingClientBadge) {
            return res.status(400).json({ message: "Cannot delete badge; it is assigned to someone" });
        }

        const imageUrl = badge.imageUrl;
        if (imageUrl) {
            // Attempt to delete the image from cloud storage
            await deleteImageSafe(imageUrl);
        }

        await AppDataSource.getRepository(Badge).delete(badge.id);
        return res.status(200).json({ message: "Badge deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/profile/my-badges', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        const clientBadges = await AppDataSource.getRepository(ClientBadge).find({
            where: { parentId: userId, childId: IsNull() },
            relations: ['badge']
        });

        const badges = clientBadges
            .map(cb => cb.badge)
            .sort((a, b) => {
                const critA = a?.criteria ?? '';
                const critB = b?.criteria ?? '';
                const critCompare = critA.localeCompare(critB);
                if (critCompare !== 0) return critCompare;
                const valA = typeof a?.valueneeded === 'number' ? a!.valueneeded! : Number.NEGATIVE_INFINITY;
                const valB = typeof b?.valueneeded === 'number' ? b!.valueneeded! : Number.NEGATIVE_INFINITY;
                return valB - valA;
            });

        return res.status(200).json(badges);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/profile/badges-to-achieve', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const parentDBStats = await AppDataSource.getRepository(ParentStat).find({
            where: { parentId: userId }
        });

        const enrichedParentStats: ParentStat[] = [];
        for (const ps of parentDBStats) {
            const childStatId = ps.childStatId;
            if (!childStatId) continue;
            const childStat = await AppDataSource.getRepository(ChildStat).findOne({
                where: { id: childStatId },
                relations: { activitySession: true }
            });
            if (!childStat) continue;
            ps.childStat = childStat;
            enrichedParentStats.push(ps);
        }

        const activitySessionMap: Map<string, ParentStat[]> = new Map();
        for (const ps of enrichedParentStats) {
            const activitySessionId = ps.childStat.activitySessionId;
            if (!activitySessionMap.has(activitySessionId)) activitySessionMap.set(activitySessionId, []);
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
            if (bestChildStat) activityToChildStat.set(activitySessionId, bestChildStat);
        }

        const parentStat = {
            totalDistanceMeters: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.distanceMeters || 0), 0),
            totalCaloriesBurned: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.caloriesBurned || 0), 0),
            totalParticipations: activityToChildStat.size,
            totalDifferentWeatherTypes: Array.from(activityToChildStat.values()).reduce((set, cs) => {
                const wt = cs.activitySession?.weatherType;
                if (wt != null) set.add(String(wt));
                return set;
            }, new Set<string>()).size,
            totalPointsEarned: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.pointsEarned || 0), 0),
        };

        const badges = await AppDataSource.getRepository(Badge).find();
        const assignedClientBadges = await AppDataSource.getRepository(ClientBadge).find({
            where: { parentId: userId, childId: IsNull() }
        });
        const achievedIds = new Set(assignedClientBadges.map(cb => cb.badgeId));

        // Exclude LEADERBOARD and SPECIAL badges from "to-achieve" list
        const excludedCriteria = [BadgeCriteria.LEADERBOARD, BadgeCriteria.SPECIAL];

        const badgesToAchieve = (await Promise.all(
            badges
                .filter(b => !achievedIds.has(b.id) && !excludedCriteria.includes(b.criteria as BadgeCriteria))
                .map(async b => {
                    const needed = typeof b.valueneeded === 'number' ? b.valueneeded : null;
                    let percentComplete: number | null = null;

                    if (needed !== null) {
                        switch (b.criteria as BadgeCriteria) {
                            case BadgeCriteria.DISTANCE:
                                percentComplete = needed <= 0 ? null : (parentStat.totalDistanceMeters / (needed * 1000)) * 100;
                                break;
                            case BadgeCriteria.CALORIES:
                                percentComplete = needed <= 0 ? null : (parentStat.totalCaloriesBurned / needed) * 100;
                                break;
                            case BadgeCriteria.WEATHER:
                                percentComplete = needed <= 0 ? null : (parentStat.totalDifferentWeatherTypes / needed) * 100;
                                break;
                            case BadgeCriteria.POINTS:
                                percentComplete = needed <= 0 ? null : (parentStat.totalPointsEarned / needed) * 100;
                                break;
                            case BadgeCriteria.PARTICIPATION:
                                percentComplete = needed <= 0 ? null : (parentStat.totalParticipations / needed) * 100;
                                break;
                            case BadgeCriteria.STREAK:
                                const totalStreaks = await getStreakForClient(null, userId);
                                percentComplete = needed <= 0 ? null : (totalStreaks / needed) * 100;
                                break;
                            case BadgeCriteria.LEADERBOARD:
                            case BadgeCriteria.SPECIAL:
                            default:
                                percentComplete = null;
                                break;
                        }
                    }

                    let percentMissing: number | null = null;
                    if (percentComplete === null) {
                        percentMissing = null;
                    } else {
                        const bounded = Math.max(0, Math.min(100, percentComplete));
                        percentMissing = Math.round((100 - bounded) * 10) / 10;
                    }

                    const computedPercentDone: number | null = (() => {
                        if (percentMissing === null) return null;
                        const val = 100 - percentMissing;
                        return parseFloat(val.toFixed(2));
                    })();

                    return {
                        id: b.id,
                        name: b.name,
                        description: b.description,
                        imageUrl: b.imageUrl,
                        criteria: b.criteria,
                        valueneeded: b.valueneeded,
                        percentDone: computedPercentDone,
                    };
                })
        )).sort((a, b) => {
            const critCompare = String(a.criteria).localeCompare(String(b.criteria));
            if (critCompare !== 0) return critCompare;
            const valA = typeof a.valueneeded === 'number' ? a.valueneeded : Number.NEGATIVE_INFINITY;
            const valB = typeof b.valueneeded === 'number' ? b.valueneeded : Number.NEGATIVE_INFINITY;
            return valA - valB;
        });

        return res.status(200).json(badgesToAchieve);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/profile/children-badges', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.query.childId as string;
        const userId = req.user!.userId;

        const isFatherOfChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: userId,
                childId: childId
            }
        });

        if (!isFatherOfChild) {
            return res.status(403).json({ message: "You are not authorized to view this child's badges" });
        }
        
        const clientBadges = await AppDataSource.getRepository(ClientBadge).find({
            where: { parentId: IsNull(), childId: childId },
            relations: ['badge']
        });

        const badges = clientBadges
            .map(cb => cb.badge)
            .sort((a, b) => {
                const critA = a?.criteria ?? '';
                const critB = b?.criteria ?? '';
                const critCompare = critA.localeCompare(critB);
                if (critCompare !== 0) return critCompare;
                const valA = typeof a?.valueneeded === 'number' ? a!.valueneeded! : Number.NEGATIVE_INFINITY;
                const valB = typeof b?.valueneeded === 'number' ? b!.valueneeded! : Number.NEGATIVE_INFINITY;
                return valB - valA;
            });

        return res.status(200).json(badges);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

router.get('/profile/children-badges-to-achieve', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.query.childId as string;
        const userId = req.user!.userId;

        if (!childId) {
            return res.status(400).json({ message: "childId is required" });
        }

        // Ensure the requesting parent is associated with the child
        const isParent = await AppDataSource.getRepository(ParentChild).findOne({
            where: { parentId: userId, childId: childId }
        });
        if (!isParent) {
            return res.status(403).json({ message: "You are not authorized to view this child's badges" });
        }

        // Aggregate child stats
        const childDBStats = await AppDataSource.getRepository(ChildStat).find({
            where: { childId: childId },
            relations: { activitySession: true }
        });

        const weatherSet = new Set<string>();
        for (const cs of childDBStats) {
            const wt = cs.activitySession?.weatherType;
            if (wt != null) weatherSet.add(String(wt));
        }

        const childStat = {
            totalDistanceMeters: childDBStats.reduce((sum, cs) => sum + (cs.distanceMeters || 0), 0),
            totalCaloriesBurned: childDBStats.reduce((sum, cs) => sum + (cs.caloriesBurned || 0), 0),
            totalParticipations: childDBStats.length,
            totalDifferentWeatherTypes: weatherSet.size,
            totalPointsEarned: childDBStats.reduce((sum, cs) => sum + (cs.pointsEarned || 0), 0),
        };

        const badges = await AppDataSource.getRepository(Badge).find();
        const assignedClientBadges = await AppDataSource.getRepository(ClientBadge).find({
            where: { childId: childId, parentId: IsNull() }
        });
        const achievedIds = new Set(assignedClientBadges.map(cb => cb.badgeId));

        // Exclude criteria that do not apply to static progress
        const excludedCriteria = [BadgeCriteria.STREAK, BadgeCriteria.LEADERBOARD, BadgeCriteria.SPECIAL];

        const badgesToAchieve = (await Promise.all(
            badges
                .filter(b => !achievedIds.has(b.id) && !excludedCriteria.includes(b.criteria as BadgeCriteria))
                .map(async b => {
                    const needed = typeof b.valueneeded === 'number' ? b.valueneeded : null;
                    let percentComplete: number | null = null;

                    if (needed !== null) {
                        switch (b.criteria as BadgeCriteria) {
                            case BadgeCriteria.DISTANCE:
                                percentComplete = needed <= 0 ? null : (childStat.totalDistanceMeters / (needed * 1000)) * 100;
                                break;
                            case BadgeCriteria.CALORIES:
                                percentComplete = needed <= 0 ? null : (childStat.totalCaloriesBurned / needed) * 100;
                                break;
                            case BadgeCriteria.WEATHER:
                                percentComplete = needed <= 0 ? null : (childStat.totalDifferentWeatherTypes / needed) * 100;
                                break;
                            case BadgeCriteria.POINTS:
                                percentComplete = needed <= 0 ? null : (childStat.totalPointsEarned / needed) * 100;
                                break;
                            case BadgeCriteria.PARTICIPATION:
                                percentComplete = needed <= 0 ? null : (childStat.totalParticipations / needed) * 100;
                                break;
                            case BadgeCriteria.STREAK:
                                const totalStreaks = await getStreakForClient(childId, null);
                                percentComplete = needed <= 0 ? null : (totalStreaks / needed) * 100;
                                break;
                            case BadgeCriteria.LEADERBOARD:
                            case BadgeCriteria.SPECIAL:
                                percentComplete = null;
                                break;
                        }
                    }

                    let percentMissing: number | null = null;
                    if (percentComplete === null) {
                        percentMissing = null;
                    } else {
                        const bounded = Math.max(0, Math.min(100, percentComplete));
                        percentMissing = Math.round((100 - bounded) * 10) / 10;
                    }

                    const computedPercentDone: number | null = (() => {
                        if (percentMissing === null) return null;
                        const val = 100 - percentMissing;
                        return parseFloat(val.toFixed(2));
                    })();

                    return {
                        id: b.id,
                        name: b.name,
                        description: b.description,
                        imageUrl: b.imageUrl,
                        criteria: b.criteria,
                        valueneeded: b.valueneeded,
                        percentDone: computedPercentDone,
                    };
                })
        )).sort((a, b) => {
            const critCompare = String(a.criteria).localeCompare(String(b.criteria));
            if (critCompare !== 0) return critCompare;
            const valA = typeof a.valueneeded === 'number' ? a.valueneeded : Number.NEGATIVE_INFINITY;
            const valB = typeof b.valueneeded === 'number' ? b.valueneeded : Number.NEGATIVE_INFINITY;
            return valA - valB;
        });

        return res.status(200).json(badgesToAchieve);

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

router.get('/profile/badges-progress', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        const badges = await AppDataSource.getRepository(Badge).find();

        const assignedClientBadges = await AppDataSource.getRepository(ClientBadge).find({
            where: { parentId: userId, childId: IsNull() },
            relations: ['badge']
        });
        const achievedIds = new Set(assignedClientBadges.map(cb => cb.badgeId));

        const parentDBStats = await AppDataSource.getRepository(ParentStat).find({
            where: { parentId: userId }
        });

        const enrichedParentStats: ParentStat[] = [];
        for (const ps of parentDBStats) {
            const childStatId = ps.childStatId;
            if (!childStatId) continue;
            const childStat = await AppDataSource.getRepository(ChildStat).findOne({
                where: { id: childStatId },
                relations: { activitySession: true }
            });
            if (!childStat) continue;
            ps.childStat = childStat;
            enrichedParentStats.push(ps);
        }

        const activitySessionMap: Map<string, ParentStat[]> = new Map();
        for (const ps of enrichedParentStats) {
            const activitySessionId = ps.childStat.activitySessionId;
            if (!activitySessionMap.has(activitySessionId)) activitySessionMap.set(activitySessionId, []);
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
            if (bestChildStat) activityToChildStat.set(activitySessionId, bestChildStat);
        }

        const parentStat = {
            totalDistanceMeters: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.distanceMeters || 0), 0),
            totalCaloriesBurned: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.caloriesBurned || 0), 0),
            totalParticipations: activityToChildStat.size,
            totalDifferentWeatherTypes: Array.from(activityToChildStat.values()).reduce((set, cs) => {
                const wt = cs.activitySession?.weatherType;
                if (wt != null) set.add(String(wt));
                return set;
            }, new Set<string>()).size,
            totalPointsEarned: Array.from(activityToChildStat.values()).reduce((sum, cs) => sum + (cs.pointsEarned || 0), 0),
        };

        const excludedCriteria = [BadgeCriteria.STREAK, BadgeCriteria.LEADERBOARD, BadgeCriteria.SPECIAL];

        const result = (await Promise.all(badges.map(async b => {
            const achieved = achievedIds.has(b.id);
            let percentDone: number | null = null;

            if (!achieved && !excludedCriteria.includes(b.criteria as BadgeCriteria)) {
                const needed = typeof b.valueneeded === 'number' ? b.valueneeded : null;
                let percentComplete: number | null = null;

                if (needed !== null) {
                    switch (b.criteria as BadgeCriteria) {
                        case BadgeCriteria.DISTANCE:
                            percentComplete = needed <= 0 ? null : (parentStat.totalDistanceMeters / (needed * 1000)) * 100;
                            break;
                        case BadgeCriteria.CALORIES:
                            percentComplete = needed <= 0 ? null : (parentStat.totalCaloriesBurned / needed) * 100;
                            break;
                        case BadgeCriteria.WEATHER:
                            percentComplete = needed <= 0 ? null : (parentStat.totalDifferentWeatherTypes / needed) * 100;
                            break;
                        case BadgeCriteria.POINTS:
                            percentComplete = needed <= 0 ? null : (parentStat.totalPointsEarned / needed) * 100;
                            break;
                        case BadgeCriteria.PARTICIPATION:
                            percentComplete = needed <= 0 ? null : (parentStat.totalParticipations / needed) * 100;
                            break;
                        case BadgeCriteria.STREAK:
                            const totalStreaks = await getStreakForClient(null, userId);
                            percentComplete = needed <= 0 ? null : (totalStreaks / needed) * 100;
                            break;
                        default:
                            percentComplete = null;
                            break;
                    }
                }

                if (percentComplete !== null) {
                    const bounded = Math.max(0, Math.min(100, percentComplete));
                    percentDone = parseFloat(bounded.toFixed(2));
                }
            }

            return {
                id: b.id,
                name: b.name,
                description: b.description,
                imageUrl: b.imageUrl,
                criteria: b.criteria,
                valueneeded: b.valueneeded,
                achieved,
                percentDone: achieved ? 100 : percentDone,
            };
        }))).sort((a, b) => {
            if (a.achieved !== b.achieved) return a.achieved ? -1 : 1;
            const critCompare = String(a.criteria).localeCompare(String(b.criteria));
            if (critCompare !== 0) return critCompare;
            const valA = typeof a.valueneeded === 'number' ? a.valueneeded : Number.NEGATIVE_INFINITY;
            const valB = typeof b.valueneeded === 'number' ? b.valueneeded : Number.NEGATIVE_INFINITY;
            return valA - valB;
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

// New endpoint: /profile/children-badges-progress
router.get('/profile/children-badges-progress', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const childId = req.query.childId as string;

        if (!childId) {
            return res.status(400).json({ message: "childId is required" });
        }

        // Verify parent-child relationship
        const isParent = await AppDataSource.getRepository(ParentChild).findOne({
            where: { parentId: userId, childId }
        });
        if (!isParent) {
            return res.status(403).json({ message: "You are not authorized to view this child's badges" });
        }

        const badges = await AppDataSource.getRepository(Badge).find();

        const assignedClientBadges = await AppDataSource.getRepository(ClientBadge).find({
            where: { childId, parentId: IsNull() },
            relations: ['badge']
        });
        const achievedIds = new Set(assignedClientBadges.map(cb => cb.badgeId));

        const childDBStats = await AppDataSource.getRepository(ChildStat).find({
            where: { childId },
            relations: { activitySession: true }
        });

        const weatherSet = new Set<string>();
        for (const cs of childDBStats) {
            const wt = cs.activitySession?.weatherType;
            if (wt != null) weatherSet.add(String(wt));
        }

        const childStat = {
            totalDistanceMeters: childDBStats.reduce((sum, cs) => sum + (cs.distanceMeters || 0), 0),
            totalCaloriesBurned: childDBStats.reduce((sum, cs) => sum + (cs.caloriesBurned || 0), 0),
            totalParticipations: childDBStats.length,
            totalDifferentWeatherTypes: weatherSet.size,
            totalPointsEarned: childDBStats.reduce((sum, cs) => sum + (cs.pointsEarned || 0), 0),
        };

        const excludedCriteria = [BadgeCriteria.STREAK, BadgeCriteria.LEADERBOARD, BadgeCriteria.SPECIAL];

        const result = (await Promise.all(badges.map(async b => {
            const achieved = achievedIds.has(b.id);
            let percentDone: number | null = null;

            if (!achieved && !excludedCriteria.includes(b.criteria as BadgeCriteria)) {
                const needed = typeof b.valueneeded === 'number' ? b.valueneeded : null;
                let percentComplete: number | null = null;

                if (needed !== null) {
                    switch (b.criteria as BadgeCriteria) {
                        case BadgeCriteria.DISTANCE:
                            percentComplete = needed <= 0 ? null : (childStat.totalDistanceMeters / (needed * 1000)) * 100;
                            break;
                        case BadgeCriteria.CALORIES:
                            percentComplete = needed <= 0 ? null : (childStat.totalCaloriesBurned / needed) * 100;
                            break;
                        case BadgeCriteria.WEATHER:
                            percentComplete = needed <= 0 ? null : (childStat.totalDifferentWeatherTypes / needed) * 100;
                            break;
                        case BadgeCriteria.POINTS:
                            percentComplete = needed <= 0 ? null : (childStat.totalPointsEarned / needed) * 100;
                            break;
                        case BadgeCriteria.PARTICIPATION:
                            percentComplete = needed <= 0 ? null : (childStat.totalParticipations / needed) * 100;
                            break;
                        case BadgeCriteria.STREAK:
                            const totalStreaks = await getStreakForClient(childId, null);
                            percentComplete = needed <= 0 ? null : (totalStreaks / needed) * 100;
                            break;
                        default:
                            percentComplete = null;
                            break;
                    }
                }

                if (percentComplete !== null) {
                    const bounded = Math.max(0, Math.min(100, percentComplete));
                    percentDone = parseFloat(bounded.toFixed(2));
                }
            }

            return {
                id: b.id,
                name: b.name,
                description: b.description,
                imageUrl: b.imageUrl,
                criteria: b.criteria,
                valueneeded: b.valueneeded,
                achieved,
                percentDone: achieved ? 100 : percentDone,
            };
        }))).sort((a, b) => {
            if (a.achieved !== b.achieved) return a.achieved ? -1 : 1;
            const critCompare = String(a.criteria).localeCompare(String(b.criteria));
            if (critCompare !== 0) return critCompare;
            const valA = typeof a.valueneeded === 'number' ? a.valueneeded : Number.NEGATIVE_INFINITY;  
            const valB = typeof b.valueneeded === 'number' ? b.valueneeded : Number.NEGATIVE_INFINITY;
            return valA - valB;
        });
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

router.get('/streak', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        // Check if childId is passed as query param
        const childId = req.query.childId as string | undefined;

        if (childId) {
            // Verify parent-child relationship
            const isParent = await AppDataSource.getRepository(ParentChild).findOne({
                where: { parentId: userId, childId }
            });
            if (!isParent) {
                return res.status(403).json({ message: "You are not authorized to view this child's streak" });
            }
            const streak = await getStreakForClient(childId, null);
            return res.status(200).json({ streak });
        } else {
            const streak = await getStreakForClient(null, userId);
            return res.status(200).json({ streak });
        }
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;