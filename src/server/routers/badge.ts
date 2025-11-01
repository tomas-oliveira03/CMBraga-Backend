import express, { Request, Response } from "express";
import { AppDataSource } from "@/db";
import { IsNull } from "typeorm";
import { Badge } from "@/db/entities/Badge";
import { ClientBadge } from "@/db/entities/ClientBadge";
import { User } from "@/db/entities/User";
import { ParentChild } from "@/db/entities/ParentChild";
import { z } from "zod";
import { authenticate, authorize } from "@/server/middleware/auth";
import { UserRole } from "@/helpers/types";
import { UpdateBadgeSchema, CreateBadgeSchema } from "../schemas/badge";
// Added imports
import { ParentStat } from "@/db/entities/ParentStat";
import { ChildStat } from "@/db/entities/ChildStat";
import { BadgeCriteria } from "@/helpers/types";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Badge
 *     description: Badge operations
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Badge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         criteria:
 *           type: string
 *           enum: [streak, distance, calories, weather, points, special]
 *         valueneeded:
 *           type: number
 *         imageUrl:
 *           type: string
 *           format: uri
 *     CreateBadge:
 *       type: object
 *       required:
 *         - name
 *         - criteria
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         criteria:
 *           type: string
 *           enum: [streak, distance, calories, weather, points, special]
 *         value:
 *           type: number
 *         imageUrl:
 *           type: string
 *           format: uri
 *     UpdateBadge:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateBadge'
 *         - type: object
 *           properties:
 *             name:
 *               type: string
 */

/**
 * @swagger
 * /badge:
 *   get:
 *     summary: Get all badges
 *     description: Returns a list of all badges
 *     tags:
 *       - Badge
 *     responses:
 *       200:
 *         description: List of badges
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const badges = await AppDataSource.getRepository(Badge).find();
        return res.status(200).json(badges);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge/{id}:
 *   get:
 *     summary: Get badge by ID
 *     description: Returns a single badge by its ID
 *     tags:
 *       - Badge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Badge found
 *       404:
 *         description: Badge not found
 */
router.get('/:id', async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /badge:
 *   post:
 *     summary: Create a new badge
 *     description: Creates a new badge
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBadge'
 *     responses:
 *       201:
 *         description: Badge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or name conflict
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateBadgeSchema.parse(req.body);

        // Validate image URL
        if (validatedData.imageUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(validatedData.imageUrl)) {
            return res.status(400).json({ message: "Invalid image URL" });
        }

        // Check if a badge with the same name already exists
        const existingBadge = await AppDataSource.getRepository(Badge).findOne({ where: { name: validatedData.name } });
        if (existingBadge) {
            return res.status(400).json({ message: "Badge name must be unique" });
        }

        await AppDataSource.getRepository(Badge).insert(validatedData);
        return res.status(201).json({ message: "Badge created successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge/{id}:
 *   put:
 *     summary: Update a badge
 *     description: Updates an existing badge
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBadge'
 *     responses:
 *       200:
 *         description: Badge updated successfully
 *       400:
 *         description: Validation error or name conflict
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Badge not found
 */
router.put('/:id', async (req: Request, res: Response) => {
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
        return res.status(200).json({ message: "Badge updated successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge/{id}:
 *   delete:
 *     summary: Delete a badge
 *     description: Deletes a badge by ID
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Badge deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin)
 *       404:
 *         description: Badge not found
 */
router.delete('/:id', authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const badge = await AppDataSource.getRepository(Badge).findOne({ where: { id: req.params.id } });
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        await AppDataSource.getRepository(Badge).delete(badge.id);
        return res.status(200).json({ message: "Badge deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge/profile/my-badges:
 *   get:
 *     summary: Get parent's own badges
 *     description: Returns badges assigned to the authenticated parent (not child-specific)
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of badges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /badge/profile/badges-to-achieve:
 *   get:
 *     summary: Get parent's badges progress to achieve
 *     description: Returns badges available for the authenticated parent and percentage progress towards each (excludes streak, leaderboard, special)
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of badges with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                   criteria:
 *                     type: string
 *                   valueneeded:
 *                     type: number
 *                   percentDone:
 *                     type: number
 *                     nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

        // Exclude STREAK, LEADERBOARD and SPECIAL badges from "to-achieve" list
        const excludedCriteria = [BadgeCriteria.STREAK, BadgeCriteria.LEADERBOARD, BadgeCriteria.SPECIAL];

        const badgesToAchieve = badges
            .filter(b => !achievedIds.has(b.id) && !excludedCriteria.includes(b.criteria as BadgeCriteria))
            .map(b => {
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
            .sort((a, b) => {
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

/**
 * @swagger
 * /badge/profile/children-badges:
 *   get:
 *     summary: Get a child's badges (parent only)
 *     description: Returns badges assigned to a specific child if the authenticated parent is linked to that child
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of child's badges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - parent not authorized for this child
 *       404:
 *         description: Child not found / no badges
 */
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

/**
 * @swagger
 * /badge/profile/children-badges-to-achieve:
 *   get:
 *     summary: Get a child's badges progress (parent only)
 *     description: Returns badges available for the specified child and percentage progress towards each (excludes streak, leaderboard, special). Requires query param childId.
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the child whose badge progress is requested
 *     responses:
 *       200:
 *         description: List of child's badges with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                   criteria:
 *                     type: string
 *                   valueneeded:
 *                     type: number
 *                   percentDone:
 *                     type: number
 *                     nullable: true
 *       400:
 *         description: Bad request (missing childId)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - parent not authorized for this child
 */
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

        const badgesToAchieve = badges
            .filter(b => !achievedIds.has(b.id) && !excludedCriteria.includes(b.criteria as BadgeCriteria))
            .map(b => {
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
            .sort((a, b) => {
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

export default router;
