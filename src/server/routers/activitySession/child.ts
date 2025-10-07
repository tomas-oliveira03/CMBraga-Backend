import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Child } from "@/db/entities/Child";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ParentChild } from "@/db/entities/ParentChild";
import { UserRole } from "@/helpers/types";
import { authenticate, authorize } from "@/server/middleware/auth";

const router = express.Router();

/**
 * @swagger
 * /activity-session/child/{id}:
 *   get:
 *     summary: Get all children from a specific activity session
 *     description: Returns a list of all child activity sessions for a specific activity session ID
 *     tags:
 *       - Activity Session - Children
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of child activity sessions for the specified activity
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
 *                   child:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "Ana Costa"
 *                       gender:
 *                         type: string
 *                         enum: [male, female]
 *                         example: "female"
 *                       school:
 *                         type: string
 *                         example: "Escola Básica de Braga"
 *                       schoolGrade:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 12
 *                         example: 2
 *                       dateOfBirth:
 *                         type: string
 *                         format: date
 *                         example: "2016-02-14"
 *                       healthProblems:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           allergies:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["lactose"]
 *                           chronicDiseases:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: []
 *                           surgeries:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 type:
 *                                   type: string
 *                                 year:
 *                                   type: number
 *                             example: []
 *                       stationId:
 *                         type: string
 *                         example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                         description: "School station ID where the child is dropped off"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-05T14:22:01.592Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
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
 */
// Get all children from an activity
router.get('/:id', async (req: Request, res: Response) => {
    const activityId = req.params.id;
    
    const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            childActivitySessions: {
                child: true
            }
        },
        select: {
            childActivitySessions: {
                registeredAt: true,
                child: true
            }
        }
    });

    if (!activityInfo){
        return res.status(404).json({ message: "Activity not found" })
    }

    return res.status(200).json(activityInfo?.childActivitySessions);
});

/**
 * @swagger
 * /activity-session/child/{id}:
 *   post:
 *     summary: Add child to an activity session
 *     description: Adds a child to a specific activity session. Parent can only add their own children.
 *     tags:
 *       - Activity Session - Children
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - stationId
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *               stationId:
 *                 type: string
 *                 example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                 description: "Station ID where the child will be picked up/dropped off"
 *           example:
 *             childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *             stationId: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *     responses:
 *       201:
 *         description: Child successfully added to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child added to activity session successfully"
 *       400:
 *         description: Child already registered for this activity session or station not assigned to activity
 *       403:
 *         description: Not authorized to add this child
 *       404:
 *         description: Activity session or child not found
 *       500:
 *         description: Internal server error
 */
// Add child to an activity
router.post('/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { childId, stationId } = req.body;

        if (!childId || !stationId) {
            return res.status(400).json({ message: "Child ID and Station ID are required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations: {
                stationActivitySessions: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        
        // Check if station is within the activity route
        if (!(activitySession.stationActivitySessions && activitySession.stationActivitySessions.some(sas => sas.stationId === stationId))) {
            return res.status(400).json({ message: "Station is not assigned to this activity session" });
        }

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Check if user is parent of the child
        const parentChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: req.user?.userId,
                childId: childId
            }
        });

        if (!parentChild) {
            return res.status(403).json({ message: "You are not authorized to add this child to the activity" });
        }

        // Check if child is already registered for this activity session
        const existingRegistration = await AppDataSource.getRepository(ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId
            }
        });
        if (existingRegistration) {
            return res.status(400).json({ message: "Child is already registered for this activity session" });
        }

        // Add child to activity session
        await AppDataSource.getRepository(ChildActivitySession).insert({
            childId: childId,
            activitySessionId: activitySessionId,
            stationId: stationId,
            parentId: req.user?.userId
        });

        return res.status(201).json({ message: "Child added to activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /activity-session/child/{id}:
 *   delete:
 *     summary: Remove child from an activity session
 *     description: Removes a child from a specific activity session. Parent can only remove their own children.
 *     tags:
 *       - Activity Session - Children
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       200:
 *         description: Child successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child removed from activity session successfully"
 *       400:
 *         description: Child not registered for this activity session
 *       403:
 *         description: Not authorized to remove this child
 *       404:
 *         description: Activity session or child not found
 *       500:
 *         description: Internal server error
 */
// Remove child from an activity
router.delete('/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { childId } = req.body;

        if (!childId) {
            return res.status(400).json({ message: "Child ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Check if user is parent of the child
        const parentChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: req.user!.userId,
                childId: childId
            }
        });

        if (!parentChild) {
            return res.status(403).json({ message: "You are not authorized to remove this child from the activity" });
        }

        // Check if child is registered for this activity session
        const existingRegistration = await AppDataSource.getRepository(ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingRegistration) {
            return res.status(400).json({ message: "Child is not registered for this activity session" });
        }

        // Remove child from activity session
        await AppDataSource.getRepository(ChildActivitySession).delete({
            childId: childId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Child removed from activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


export default router;