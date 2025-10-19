import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { UserRole } from "@/helpers/types";
import { Parent } from "@/db/entities/Parent";
import { ParentActivitySession } from "@/db/entities/ParentActivitySession";
import { authenticate, authorize } from "@/server/middleware/auth";

const router = express.Router();

/**
 * @swagger
 * /activity-session/parent:
 *   get:
 *     summary: Get all parents from a specific activity session
 *     description: Returns a list of all parent activity sessions for a specific activity session ID
 *     tags:
 *       - Activity Session - Parents
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of parent activity sessions for the specified activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   registeredAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-05T14:19:46.908Z"
 *                   parent:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "Maria Silva"
 *       400:
 *         description: Missing or invalid activity ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity ID is required"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity not found"
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const activityId = req.query.id;

        if (!activityId || typeof activityId !== 'string') {
            return res.status(400).json({ message: "Activity ID is required" });
        }
        
        const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activityId
            },
            relations: {
                parentActivitySessions: {
                    parent: true
                }
            },
            select: {
                parentActivitySessions: {
                    registeredAt: true,
                    parent: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!activityInfo){
            return res.status(404).json({ message: "Activity not found" })
        }

        return res.status(200).json(activityInfo?.parentActivitySessions);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /activity-session/parent:
 *   post:
 *     summary: Assign a parent to an activity session
 *     description: Assigns a parent to a specific activity session. Only admins can perform this action.
 *     tags:
 *       - Activity Session - Parents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *         description: Parent ID (UUID)
 *     responses:
 *       201:
 *         description: Parent successfully assigned to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent assigned to activity session successfully"
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 missing_params:
 *                   value:
 *                     message: "Activity Session ID and Parent ID are required"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Activity session or parent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 activity_not_found:
 *                   value:
 *                     message: "Activity session not found"
 *                 parent_not_found:
 *                   value:
 *                     message: "Parent not found"
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.activitySessionId;
        const parentId = req.query.parentId;
        
        if (!activitySessionId || !parentId || typeof activitySessionId !== 'string' || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID and Parent ID are required" });
        }

        if (!parentId || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Parent ID is required" });
        }   
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        if(activitySession.startedAt){
            return res.status(404).json({ message: "Cannot register on an ongoing or past activity" });
        }

        await AppDataSource.getRepository(ParentActivitySession).insert({
                parentId: parentId,
                activitySessionId: activitySessionId
        });

        return res.status(201).json({ message: "Parent assigned to activity session successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /activity-session/parent:
 *   delete:
 *     summary: Remove a parent from an activity session
 *     description: Removes a parent from a specific activity session. Only admins can perform this action.
 *     tags:
 *       - Activity Session - Parents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *         description: Parent ID (UUID)
 *     responses:
 *       200:
 *         description: Parent successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent removed from activity session successfully"
 *       400:
 *         description: Missing required parameters or parent not assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 missing_params:
 *                   value:
 *                     message: "Activity Session ID and Parent ID are required"
 *                 not_assigned:
 *                   value:
 *                     message: "Parent is not assigned to this activity session"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Activity session or parent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 activity_not_found:
 *                   value:
 *                     message: "Activity session not found"
 *                 parent_not_found:
 *                   value:
 *                     message: "Parent not found"
 *       500:
 *         description: Internal server error
 */
router.delete('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.activitySessionId;
        const parentId  = req.query.parentId;

        if (!activitySessionId || !parentId || typeof activitySessionId !== 'string' || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID and Parent ID are required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        // Check if parent is assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(ParentActivitySession).findOne({
            where: {
                parentId: parentId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Parent is not assigned to this activity session" });
        }

        // Remove parent from activity session
        await AppDataSource.getRepository(ParentActivitySession).delete({
                parentId: parentId,
                activitySessionId: activitySessionId
        });

        // Remove parent from activity session
        await AppDataSource.getRepository(ParentActivitySession).delete({
            parentId: parentId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Parent removed from activity session successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;