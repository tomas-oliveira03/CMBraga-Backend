"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
const express_1 = __importDefault(require("express"));
const activitySession_1 = require("../schemas/activitySession");
const zod_1 = require("zod");
const ActivitySession_1 = require("../../db/entities/ActivitySession");
const types_1 = require("../../helpers/types");
const router = express_1.default.Router();
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
router.get('/', async (req, res) => {
    const allSessions = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).find();
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
 *                 mode:
 *                   type: string
 *                   enum: [walk, bike]
 *                   example: "bike"
 *                   description: "Transportation mode (automatically set based on type)"
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
router.get('/:id', async (req, res) => {
    const sessionId = req.params.id;
    const session = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
        where: {
            id: sessionId
        }
    });
    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }
    return res.status(200).json(session);
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
 *               - scheduledAt
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *                 description: "Activity type (mode will be auto-set: pedibus=walk, ciclo_expresso=bike)"
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
router.post('/', async (req, res) => {
    try {
        const validatedData = activitySession_1.CreateActivitySessionSchema.parse(req.body);
        await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).insert({
            ...validatedData,
            mode: validatedData.type === types_1.ActivityType.PEDIBUS ? types_1.ActivityMode.WALK : types_1.ActivityMode.BIKE
        });
        return res.status(201).json({ message: "Session created successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', async (req, res) => {
    try {
        const activitySessionId = req.params.id;
        const validatedData = activitySession_1.UpdateActivitySessionSchema.parse(req.body);
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        // Update activity session with updatedAt timestamp
        if (validatedData.type) {
            await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).update(activitySession.id, {
                ...validatedData,
                updatedAt: new Date(),
                mode: validatedData.type === types_1.ActivityType.PEDIBUS ? types_1.ActivityMode.WALK : types_1.ActivityMode.BIKE
            });
        }
        else {
            await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).update(activitySession.id, {
                ...validatedData,
                updatedAt: new Date()
            });
        }
        return res.status(200).json({ message: "Activity session updated successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', async (req, res) => {
    try {
        const sessionId = req.params.id;
        const session = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: sessionId }
        });
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).delete(session.id);
        return res.status(200).json({ message: "Session deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: error });
    }
});
exports.default = router;
