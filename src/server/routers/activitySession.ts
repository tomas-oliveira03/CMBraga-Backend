import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { CreateActivitySessionSchema, UpdateActivitySessionSchema } from "../schemas/activitySession";
import { z } from "zod";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Child } from "@/db/entities/Child";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ParentChild } from "@/db/entities/ParentChild";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "@/helpers/types";
import { Instructor } from "@/db/entities/Instructor";
import { InstructorActivitySession } from "@/db/entities/InstructorActivitySession";
import { Station } from "@/db/entities/Station";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { datetime } from "zod/v4/core/regexes.cjs";

const router = express.Router();


// ========================================
// STATION ACTIONS
// ========================================

/**
 * @swagger
 * /activity-session/station/{id}:
 *   get:
 *     summary: Get all stations from a specific activity session
 *     description: Returns a list of all station activity sessions for a specific activity session ID, ordered by stop number
 *     tags:
 *       - Activity Session - Stations
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
 *         description: List of station activity sessions for the specified activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   stopNumber:
 *                     type: integer
 *                     example: 1
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:15:00.000Z"
 *                   arrivedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:17:00.000Z"
 *                   station:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "Estação Central"
 *                       type:
 *                         type: string
 *                         enum: [regular, school]
 *                         example: "regular"
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
// Get all stations from an activity
router.get('/station/:id', async (req: Request, res: Response) => {
    const activityId = req.params.id;
    
    const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            stationActivitySessions: {
                station: true
            }
        },
        select: {
            stationActivitySessions: {
                stopNumber: true,
                scheduledAt: true,
                arrivedAt: true,
                station: true
            }
        }
    });

    if (!activityInfo){
        return res.status(404).json({ message: "Activity not found" })
    }

    // Sort by stop number
    const sortedStations = activityInfo.stationActivitySessions.sort((a, b) => a.stopNumber - b.stopNumber);

    return res.status(200).json(sortedStations);
});

/**
 * @swagger
 * /activity-session/station/{id}:
 *   post:
 *     summary: Add station to an activity session
 *     description: Adds a station to a specific activity session as the last stop. Only admins can add stations.
 *     tags:
 *       - Activity Session - Stations
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
 *               - stationId
 *               - scheduledAt
 *             properties:
 *               stationId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-20T08:15:00.000Z"
 *               arrivedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *           example:
 *             stationId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *             scheduledAt: "2024-01-20T08:15:00.000Z"
 *     responses:
 *       201:
 *         description: Station successfully added to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station added to activity session successfully"
 *       400:
 *         description: Station already assigned to this activity session
 *       404:
 *         description: Activity session or station not found
 *       500:
 *         description: Internal server error
 */
// Add station to an activity
router.post('/station/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { stationId, scheduledAt } = req.body;

        if (!stationId || !scheduledAt) {
            return res.status(400).json({ message: "Station ID and scheduledAt are required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const station = await AppDataSource.getRepository(Station).findOne({
            where: { id: stationId }
        });
        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }

        // Check if station is already assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (existingAssignment) {
            return res.status(400).json({ message: "Station is already assigned to this activity session" });
        }

        // Get the current highest stop number for this activity session
        const currentStations = await AppDataSource.getRepository(StationActivitySession).find({
            where: { activitySessionId: activitySessionId },
            order: { stopNumber: 'DESC' },
            take: 1
        });

        const nextStopNumber = currentStations.length > 0 ? currentStations[0]!.stopNumber + 1 : 1;

        // Add station to activity session
        await AppDataSource.getRepository(StationActivitySession).insert({
            stationId: stationId,
            activitySessionId: activitySessionId,
            stopNumber: nextStopNumber,
            scheduledAt: new Date(scheduledAt)
        });

        return res.status(201).json({ message: "Station added to activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /activity-session/station/{id}:
 *   put:
 *     summary: Update station order in an activity session
 *     description: Updates the stop number of a station in an activity session. Only admins can update station order.
 *     tags:
 *       - Activity Session - Stations
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
 *               - stationId
 *               - newStopNumber
 *             properties:
 *               stationId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *               newStopNumber:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *           example:
 *             stationId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *             newStopNumber: 2
 *     responses:
 *       200:
 *         description: Station order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station order updated successfully"
 *       400:
 *         description: Invalid stop number or station not found in activity
 *       404:
 *         description: Activity session or station not found
 *       500:
 *         description: Internal server error
 */
// Update station order in an activity
router.put('/station/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { stationId, newStopNumber } = req.body;

        if (!stationId || !newStopNumber || newStopNumber < 1) {
            return res.status(400).json({ message: "Station ID and valid new stop number are required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        // Get current station assignment
        const currentAssignment = await AppDataSource.getRepository(StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (!currentAssignment) {
            return res.status(400).json({ message: "Station is not assigned to this activity session" });
        }

        // Get all stations for this activity session
        const allStations = await AppDataSource.getRepository(StationActivitySession).find({
            where: { activitySessionId: activitySessionId },
            order: { stopNumber: 'ASC' }
        });

        if (newStopNumber > allStations.length) {
            return res.status(400).json({ message: "New stop number exceeds total number of stations" });
        }

        const oldStopNumber = currentAssignment.stopNumber;

        if (oldStopNumber === newStopNumber) {
            return res.status(200).json({ message: "Station is already at the specified stop number" });
        }

        // Update stop numbers
        if (oldStopNumber < newStopNumber) {
            // Moving station forward: decrease stop numbers of stations between old and new position
            await AppDataSource.getRepository(StationActivitySession)
                .createQueryBuilder()
                .update()
                .set({ stopNumber: () => "stop_number - 1" })
                .where("activity_session_id = :activitySessionId", { activitySessionId })
                .andWhere("stop_number > :oldStopNumber", { oldStopNumber })
                .andWhere("stop_number <= :newStopNumber", { newStopNumber })
                .execute();
        } else {
            // Moving station backward: increase stop numbers of stations between new and old position
            await AppDataSource.getRepository(StationActivitySession)
                .createQueryBuilder()
                .update()
                .set({ stopNumber: () => "stop_number + 1" })
                .where("activity_session_id = :activitySessionId", { activitySessionId })
                .andWhere("stop_number >= :newStopNumber", { newStopNumber })
                .andWhere("stop_number < :oldStopNumber", { oldStopNumber })
                .execute();
        }

        // Update the moved station's stop number
        await AppDataSource.getRepository(StationActivitySession).update(
            { stationId, activitySessionId },
            { stopNumber: newStopNumber }
        );

        return res.status(200).json({ message: "Station order updated successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /activity-session/station/{id}:
 *   delete:
 *     summary: Remove station from an activity session
 *     description: Removes a station from a specific activity session and updates stop numbers. Only admins can remove stations.
 *     tags:
 *       - Activity Session - Stations
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
 *               - stationId
 *             properties:
 *               stationId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             stationId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       200:
 *         description: Station successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station removed from activity session successfully"
 *       400:
 *         description: Station not assigned to this activity session
 *       404:
 *         description: Activity session or station not found
 *       500:
 *         description: Internal server error
 */
// Remove station from an activity
router.delete('/station/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { stationId } = req.body;

        if (!stationId) {
            return res.status(400).json({ message: "Station ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const station = await AppDataSource.getRepository(Station).findOne({
            where: { id: stationId }
        });
        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }

        // Get the station assignment to be deleted
        const existingAssignment = await AppDataSource.getRepository(StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Station is not assigned to this activity session" });
        }

        const deletedStopNumber = existingAssignment.stopNumber;

        // Remove station from activity session
        await AppDataSource.getRepository(StationActivitySession).delete({
            stationId: stationId,
            activitySessionId: activitySessionId
        });

        // Update stop numbers of stations that come after the deleted station (decrease by 1)
        await AppDataSource.getRepository(StationActivitySession)
            .createQueryBuilder()
            .update()
            .set({ stopNumber: () => "stop_number - 1" })
            .where("activity_session_id = :activitySessionId", { activitySessionId })
            .andWhere("stop_number > :deletedStopNumber", { deletedStopNumber })
            .execute();

        return res.status(200).json({ message: "Station removed from activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


// router.get('/stop', async (req: Request, res: Response) => {
//     try {
//         const activitySessionId = req.query.id;
//         const stationId = req.query.stationId;

//         if (!activitySessionId || !stationId || typeof activitySessionId !== "string" || typeof stationId !== "string") {
//             return res.status(400).json({ message: "Activity session ID and station ID are required" });
//         }

//         const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
//             where: { id: activitySessionId }
//         });

//         if (!activitySession) {
//             return res.status(404).json({ message: "Activity session not found" });
//         }

//         const stationActivity = await AppDataSource.getRepository(StationActivitySession).findOne({
//             where: { 
//                 activitySessionId: activitySessionId,
//                 stationId: stationId 
//             },
//             relations: { 
//                 station: true,
//                 activitySession: {
//                     childActivitySessions: {
//                         child: true
//                     }
//                 }
//             },
//             select: {
//                 station: {
//                     name: true,
//                     type: true
//                 }
//             }
//         });

//         if (!stationActivity) {
//             return res.status(404).json({ message: "Station not found in this activity session" });
//         }

//         const childrenEntering = await AppDataSource.getRepository(ChildActivitySession).find({
//             where: {
//                 activitySessionId: activitySessionId,
//                 stationId: stationId
//             },
//             relations: { child: true },
//             select: {
//                 child: {
//                     name: true,
//                     school: true
//                 }
//             }
//         });

//         return res.status(200).json({ 
//             station: stationActivity.station,
//             children: childrenEntering.map(c => c.child) });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: error });
//     }
// });




// ========================================
// CHILD ACTIONS
// ========================================

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
router.get('/child/:id', async (req: Request, res: Response) => {
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
router.post('/child/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
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
        console.log(activitySession)
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
                parentId: req.user!.userId,
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
            stationId: stationId
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
router.delete('/child/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
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



// ========================================
// INSTRUCTOR ACTIONS
// ========================================

/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   get:
 *     summary: Get all instructors from a specific activity session
 *     description: Returns a list of all instructor activity sessions for a specific activity session ID
 *     tags:
 *       - Activity Session - Instructors
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
 *         description: List of instructor activity sessions for the specified activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   assignedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-05T14:19:46.908Z"
 *                   instructor:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "João Silva"
 *                       email:
 *                         type: string
 *                         example: "joao.silva@cmbraga.pt"
 *                       phone:
 *                         type: string
 *                         example: "+351 925 678 901"
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
// Get all instructors from an activity
router.get('/instructor/:id', async (req: Request, res: Response) => {
    const activityId = req.params.id;
    
    const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            instructorActivitySessions: {
                instructor: true
            }
        },
        select: {
            instructorActivitySessions: {
                assignedAt: true,
                instructor: true
            }
        }
    });

    if (!activityInfo){
        return res.status(404).json({ message: "Activity not found" })
    }

    return res.status(200).json(activityInfo?.instructorActivitySessions);
});

/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   post:
 *     summary: Assign instructor to an activity session
 *     description: Assigns an instructor to a specific activity session. Only admins can assign instructors.
 *     tags:
 *       - Activity Session - Instructors
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
 *               - instructorId
 *             properties:
 *               instructorId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       201:
 *         description: Instructor successfully assigned to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor assigned to activity session successfully"
 *       400:
 *         description: Instructor already assigned to this activity session
 *       404:
 *         description: Activity session or instructor not found
 *       500:
 *         description: Internal server error
 */
// Assign instructor to an activity
router.post('/instructor/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorId } = req.body;

        if (!instructorId) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }   
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        // Check if instructor is already assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(InstructorActivitySession).findOne({
            where: {
                instructorId: instructorId,
                activitySessionId: activitySessionId
            }
        });
        if (existingAssignment) {
            return res.status(400).json({ message: "Instructor is already assigned to this activity session" });
        }

        // Assign instructor to activity session
        await AppDataSource.getRepository(InstructorActivitySession).insert({
            instructorId: instructorId,
            activitySessionId: activitySessionId
        });

        return res.status(201).json({ message: "Instructor assigned to activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   delete:
 *     summary: Remove instructor from an activity session
 *     description: Removes an instructor from a specific activity session. Only admins can remove instructors.
 *     tags:
 *       - Activity Session - Instructors
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
 *               - instructorId
 *             properties:
 *               instructorId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       200:
 *         description: Instructor successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor removed from activity session successfully"
 *       400:
 *         description: Instructor not assigned to this activity session
 *       404:
 *         description: Activity session or instructor not found
 *       500:
 *         description: Internal server error
 */
// Remove instructor from an activity
router.delete('/instructor/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorId } = req.body;

        if (!instructorId) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        // Check if instructor is assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(InstructorActivitySession).findOne({
            where: {
                instructorId: instructorId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        // Remove instructor from activity session
        await AppDataSource.getRepository(InstructorActivitySession).delete({
            instructorId: instructorId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Instructor removed from activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});



// ========================================
// ACTIVITY ACTIONS
// ========================================

/**
 * @swagger
 * /activity-session:
 *   get:
 *     summary: Get all activity sessions
 *     description: Returns a list of all activity sessions
 *     tags:
 *       - Activity Session
 *     responses:
 *       200:
 *         description: List of activity sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   type:
 *                     type: string
 *                     enum: [pedibus, ciclo_expresso]
 *                     example: "pedibus"
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:00:00.000Z"
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T08:05:00.000Z"
 *                   finishedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T09:00:00.000Z"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T14:45:30.000Z"
 */
router.get('/', async (req: Request, res: Response) => {
    const allSessions = await AppDataSource.getRepository(ActivitySession).find();
    return res.status(200).json(allSessions);
});

/**
 * @swagger
 * /activity-session/{id}:
 *   get:
 *     summary: Get activity session by ID
 *     description: Returns a single activity session by its ID
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity session found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 type:
 *                   type: string
 *                   enum: [pedibus, ciclo_expresso]
 *                   example: "ciclo_expresso"
 *                 scheduledAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T08:00:00.000Z"
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-01-20T08:05:00.000Z"
 *                 finishedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
    const sessionId = req.params.id;

    const session = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: sessionId
        }
    });

    if (!session){
        return res.status(404).json({ message: "Session not found" })
    }

    return res.status(200).json(session);
});

/**
 * @swagger
 * /activity-session:
 *   post:
 *     summary: Create a new activity session
 *     description: Creates a new activity session (Pedibus or Ciclo Expresso)
 *     tags:
 *       - Activity Session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - scheduledAt
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-25T08:00:00.000Z"
 *           example:
 *             type: "pedibus"
 *             scheduledAt: "2024-01-25T08:00:00.000Z"
 *     responses:
 *       201:
 *         description: Activity session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session created successfully"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateActivitySessionSchema.parse(req.body);
    
    await AppDataSource.getRepository(ActivitySession).insert(validatedData);
            
    return res.status(201).json({message: "Session created successfully"});

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues
      });
    }

    console.error(error);
    return res.status(500).json({ message: error });
  }
});

/**
 * @swagger
 * /activity-session/actions/start/{id}:
 *   post:
 *     summary: Start an activity session
 *     description: Marks an activity session as started (sets startedAt). Only instructors assigned to the activity can start it.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity started successfully"
 *       400:
 *         description: Activity already started or instructor not assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               already_started:
 *                 summary: Activity already started
 *                 value:
 *                   message: "Activity session already started"
 *               not_assigned:
 *                 summary: Instructor not assigned
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/actions/start/:id', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const activity = AppDataSource.getRepository(ActivitySession);

        const activitySession = await activity.findOne({ 
            where: { id: activitySessionId },
            relations: {
                instructorActivitySessions: true
            }
        });
        
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        if (activitySession.startedAt) {
            return res.status(400).json({ message: "Activity session already started" });
        }

        const now = new Date();
        await activity.update(activitySession.id, { startedAt: now, updatedAt: now });

        return res.status(200).json({ message: "Activity started successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});



/**
 * @swagger
 * /activity-session/actions/end/{id}:
 *   post:
 *     summary: End an activity session
 *     description: Marks an activity session as finished (sets finishedAt). The activity must be started before it can be finished. Only instructors assigned to the activity can end it.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity finished successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity finished successfully"
 *       400:
 *         description: Activity not started yet, already finished, or instructor not assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_started:
 *                 summary: Activity not started
 *                 value:
 *                   message: "Activity session not started yet"
 *               already_finished:
 *                 summary: Activity already finished
 *                 value:
 *                   message: "Activity session already finished"
 *               not_assigned:
 *                 summary: Instructor not assigned
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/actions/end/:id', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const activity = AppDataSource.getRepository(ActivitySession);

        const activitySession = await activity.findOne({ 
            where: { id: activitySessionId },
            relations: {
                instructorActivitySessions: true
            }
        });
        
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        if(!activitySession.startedAt){
            return res.status(400).json({ message: "Activity session not started yet"});
        }

        if (activitySession.finishedAt) {
            return res.status(400).json({ message: "Activity session already finished" });
        }

        const now = new Date();
        await activity.update(activitySession.id, { finishedAt: now, updatedAt: now });

        return res.status(200).json({ message: "Activity finished successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /activity-session/{id}:
 *   put:
 *     summary: Update an activity session
 *     description: Updates an existing activity session
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "ciclo_expresso"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-25T09:00:00.000Z"
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2024-01-25T09:05:00.000Z"
 *               finishedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2024-01-25T10:00:00.000Z"
 *           example:
 *             startedAt: "2024-01-25T08:05:00.000Z"
 *     responses:
 *       200:
 *         description: Activity session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Activity session not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const validatedData = UpdateActivitySessionSchema.parse(req.body);
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        })

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        // Update activity session with updatedAt timestamp
        await AppDataSource.getRepository(ActivitySession).update(activitySession.id, {
            ...validatedData,
            updatedAt: new Date()
        })

        return res.status(200).json({ message: "Activity session updated successfully" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /activity-session/{id}:
 *   delete:
 *     summary: Delete an activity session
 *     description: Deletes an activity session by ID
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session deleted successfully"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const sessionId = req.params.id;
        
        const session = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: sessionId }
        })

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }


        await AppDataSource.getRepository(ActivitySession).delete(session.id);
        
        return res.status(200).json({ message: "Session deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
});


export default router;
