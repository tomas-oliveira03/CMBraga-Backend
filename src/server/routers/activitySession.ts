import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { CreateActivitySessionSchema, UpdateActivitySessionSchema } from "../schemas/activitySession";
import { z } from "zod";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { ActivityMode, ActivityType } from "@/helpers/types";
import { Route } from "@/db/entities/Route";
import { StationActivitySession } from "@/db/entities/StationActivitySession";

const router = express.Router();


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
 *                   mode:
 *                     type: string
 *                     enum: [walk, bike]
 *                     example: "walk"
 *                     description: "Transportation mode (walk for pedibus, bike for ciclo_expresso)"
 *                   routeId:
 *                     type: string
 *                     nullable: true
 *                     example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                     description: "Associated route ID (UUID)"
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
    try {
        const allSessions = await AppDataSource.getRepository(ActivitySession).find();
        return res.status(200).json(allSessions);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /activity-session/{id}:
 *   get:
 *     summary: Get activity session by ID
 *     description: Returns a single activity session by its ID, including a flattened stations array.
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
 *                 mode:
 *                   type: string
 *                   enum: [walk, bike]
 *                   example: "bike"
 *                 routeId:
 *                   type: string
 *                   nullable: true
 *                   example: "c3d4e5f6-g7h8-9012-cdef-34567890123a"
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
 *                 stations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stationId:
 *                         type: string
 *                         example: "b8b395a0-9239-45cc-bd25-1173744dcbc2"
 *                       stopNumber:
 *                         type: integer
 *                         example: 1
 *                       scheduledAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-24T19:12:13.250Z"
 *                       arrivedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       leftAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       name:
 *                         type: string
 *                         example: "R. Manuel Ferreira Gomes"
 *                       type:
 *                         type: string
 *                         enum: [regular, school]
 *                         example: "regular"
 *                       latitude:
 *                         type: number
 *                         example: 41.553404
 *                       longitude:
 *                         type: number
 *                         example: -8.397567
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
    try {
        const sessionId = req.params.id;

        const session = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: sessionId
            },
            relations: {
                stationActivitySessions: {
                    station: true
                }
            }
        });
        if (!session){
            return res.status(404).json({ message: "Session not found" })
        }

        // Flatten stationActivitySessions to stations array
        const stations = session.stationActivitySessions.map(sas => ({
            stationId: sas.stationId,
            stopNumber: sas.stopNumber,
            scheduledAt: sas.scheduledAt,
            arrivedAt: sas.arrivedAt,
            leftAt: sas.leftAt,
            name: sas.station.name,
            type: sas.station.type,
            latitude: sas.station.latitude,
            longitude: sas.station.longitude
        }));

        const { stationActivitySessions, ...rest } = session;
        const response = {
            ...rest,
            stations
        };

        return res.status(200).json(response);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /activity-session:
 *   post:
 *     summary: Create a new activity session
 *     description: Creates a new activity session (Pedibus or Ciclo Expresso). The mode is automatically set based on type (pedibus=walk, ciclo_expresso=bike).
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
 *               - routeId
 *               - scheduledAt
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *                 description: "Activity type (mode will be auto-set: pedibus=walk, ciclo_expresso=bike)"
 *               routeId:
 *                 type: string
 *                 example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                 description: "Associated route ID (UUID)"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-25T08:00:00.000Z"
 *           example:
 *             type: "pedibus"
 *             routeId: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
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

    const route = await AppDataSource.getRepository(Route).findOne({
        where: {
            id: validatedData.routeId 
        },
        relations: {
            routeStations: true
        }
    });
    if (!route) {
        return res.status(404).json({ message: "Route not found" });
    }
    if(route.activityType !== validatedData.type){
        return res.status(400).json({ message: "Cannot link an activity to a different route type" });
    }

    await AppDataSource.transaction(async tx => {

        const activityMode = validatedData.type === ActivityType.PEDIBUS ? ActivityMode.WALK : ActivityMode.BIKE;

        const activitySession = await tx.getRepository(ActivitySession).insert({
            ...validatedData,
            mode: activityMode
        });
        const activitySessionId = activitySession.identifiers[0]?.id;

        const stationsActivitySession = route.routeStations.map(station => ({
            stationId: station.stationId,
            activitySessionId: activitySessionId,
            stopNumber: station.stopNumber,
            scheduledAt: new Date(validatedData.scheduledAt.getTime() + station.timeFromStartMinutes * 60 * 1000)
        }));

        await tx.getRepository(StationActivitySession).insert(stationsActivitySession);
    });

            
    return res.status(201).json({message: "Activity session created successfully"});

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues
      });
    }

    return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
});

/**
 * @swagger
 * /activity-session/{id}:
 *   put:
 *     summary: Update an activity session
 *     description: Updates an existing activity session. When type is changed, mode is automatically updated.
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
 *                 description: "Activity type (mode will be auto-updated: pedibus=walk, ciclo_expresso=bike)"
 *               routeId:
 *                 type: string
 *                 example: "c3d4e5f6-g7h8-9012-cdef-34567890123a"
 *                 description: "Associated route ID (UUID)"
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
 *             type: "ciclo_expresso"
 *             routeId: "c3d4e5f6-g7h8-9012-cdef-34567890123a"
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
        if (validatedData.type){
            await AppDataSource.getRepository(ActivitySession).update(activitySession.id, {
                ...validatedData,
                updatedAt: new Date(),
                mode: validatedData.type === ActivityType.PEDIBUS ? ActivityMode.WALK : ActivityMode.BIKE
            })
        }
        else{
            await AppDataSource.getRepository(ActivitySession).update(activitySession.id, {
                ...validatedData,
                updatedAt: new Date()
            })
        }

        return res.status(200).json({ message: "Activity session updated successfully" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
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
            where: { id: sessionId },
            relations:{
                instructorActivitySessions: true,
                childActivitySessions: true,
                parentActivitySessions: true
            }
        })

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if(session.startedAt){
            return res.status(404).json({ message: "Session already started"});
        }

        if(session.childActivitySessions.length > 0 || session.parentActivitySessions.length > 0 || session.instructorActivitySessions.length > 0){
            return res.status(400).json({ message: "Session has active child, parent or instructor sessions" });
        }

        await AppDataSource.getRepository(ActivitySession).delete(session.id);
        
        return res.status(200).json({ message: "Session deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;
