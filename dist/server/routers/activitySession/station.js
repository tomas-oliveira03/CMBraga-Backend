"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../../db");
const express_1 = __importDefault(require("express"));
const ActivitySession_1 = require("../../../db/entities/ActivitySession");
const types_1 = require("../../../helpers/types");
const Station_1 = require("../../../db/entities/Station");
const StationActivitySession_1 = require("../../../db/entities/StationActivitySession");
const auth_1 = require("../../../server/middleware/auth");
const router = express_1.default.Router();
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
 *                   leftAt:
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
router.get('/:id', async (req, res) => {
    const activityId = req.params.id;
    const activityInfo = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
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
                leftAt: true,
                station: true
            }
        }
    });
    if (!activityInfo) {
        return res.status(404).json({ message: "Activity not found" });
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
 *               leftAt:
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
router.post('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    try {
        const activitySessionId = req.params.id;
        const { stationId, scheduledAt } = req.body;
        if (!stationId || !scheduledAt) {
            return res.status(400).json({ message: "Station ID and scheduledAt are required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        const station = await db_1.AppDataSource.getRepository(Station_1.Station).findOne({
            where: { id: stationId }
        });
        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }
        // Check if station is already assigned to this activity session
        const existingAssignment = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (existingAssignment) {
            return res.status(400).json({ message: "Station is already assigned to this activity session" });
        }
        // Get the current highest stop number for this activity session
        const currentStations = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).find({
            where: { activitySessionId: activitySessionId },
            order: { stopNumber: 'DESC' },
            take: 1
        });
        const nextStopNumber = currentStations.length > 0 ? currentStations[0].stopNumber + 1 : 1;
        // Add station to activity session
        await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).insert({
            stationId: stationId,
            activitySessionId: activitySessionId,
            stopNumber: nextStopNumber,
            scheduledAt: new Date(scheduledAt)
        });
        return res.status(201).json({ message: "Station added to activity session successfully" });
    }
    catch (error) {
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
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    try {
        const activitySessionId = req.params.id;
        const { stationId, newStopNumber } = req.body;
        if (!stationId || !newStopNumber || newStopNumber < 1) {
            return res.status(400).json({ message: "Station ID and valid new stop number are required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        // Get current station assignment
        const currentAssignment = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (!currentAssignment) {
            return res.status(400).json({ message: "Station is not assigned to this activity session" });
        }
        // Get all stations for this activity session
        const allStations = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).find({
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
            await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession)
                .createQueryBuilder()
                .update()
                .set({ stopNumber: () => "stop_number - 1" })
                .where("activity_session_id = :activitySessionId", { activitySessionId })
                .andWhere("stop_number > :oldStopNumber", { oldStopNumber })
                .andWhere("stop_number <= :newStopNumber", { newStopNumber })
                .execute();
        }
        else {
            // Moving station backward: increase stop numbers of stations between new and old position
            await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession)
                .createQueryBuilder()
                .update()
                .set({ stopNumber: () => "stop_number + 1" })
                .where("activity_session_id = :activitySessionId", { activitySessionId })
                .andWhere("stop_number >= :newStopNumber", { newStopNumber })
                .andWhere("stop_number < :oldStopNumber", { oldStopNumber })
                .execute();
        }
        // Update the moved station's stop number
        await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).update({ stationId, activitySessionId }, { stopNumber: newStopNumber });
        return res.status(200).json({ message: "Station order updated successfully" });
    }
    catch (error) {
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
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    try {
        const activitySessionId = req.params.id;
        const { stationId } = req.body;
        if (!stationId) {
            return res.status(400).json({ message: "Station ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        const station = await db_1.AppDataSource.getRepository(Station_1.Station).findOne({
            where: { id: stationId }
        });
        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }
        // Get the station assignment to be deleted
        const existingAssignment = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
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
        await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).delete({
            stationId: stationId,
            activitySessionId: activitySessionId
        });
        // Update stop numbers of stations that come after the deleted station (decrease by 1)
        await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession)
            .createQueryBuilder()
            .update()
            .set({ stopNumber: () => "stop_number - 1" })
            .where("activity_session_id = :activitySessionId", { activitySessionId })
            .andWhere("stop_number > :deletedStopNumber", { deletedStopNumber })
            .execute();
        return res.status(200).json({ message: "Station removed from activity session successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
exports.default = router;
