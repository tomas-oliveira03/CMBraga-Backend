"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../../db");
const express_1 = __importDefault(require("express"));
const ActivitySession_1 = require("../../../db/entities/ActivitySession");
const auth_1 = require("../../../server/middleware/auth");
const actions_1 = require("../../../server/services/actions");
const types_1 = require("../../../helpers/types");
const StationActivitySession_1 = require("../../../db/entities/StationActivitySession");
const Station_1 = require("../../../db/entities/Station");
const Child_1 = require("../../../db/entities/Child");
const ChildActivitySession_1 = require("../../../db/entities/ChildActivitySession");
const ChildStation_1 = require("../../../db/entities/ChildStation");
const typeorm_1 = require("typeorm");
const weather_1 = require("../../../server/services/weather");
const router = express_1.default.Router();
/**
 * @swagger
 * /activity-session/actions/start:
 *   post:
 *     summary: Start an activity session
 *     description: Allows an instructor to start an activity session within 30 minutes before the scheduled time.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
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
 *             examples:
 *               success:
 *                 value:
 *                   message: "Activity started successfully"
 *       400:
 *         description: Bad request or already started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_id:
 *                 value:
 *                   message: "Activity session ID is required"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *               already_started:
 *                 value:
 *                   message: "Activity session already started"
 *               too_early:
 *                 value:
 *                   message: "Cannot start activity: must be within 30 minutes of scheduled time"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found"
 */
router.post('/start', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
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
        const scheduledTime = new Date(activitySession.scheduledAt);
        const earliestStartTime = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
        const DateNow = new Date();
        const time = DateNow.getTime() - earliestStartTime.getTime();
        if (time < 0) {
            return res.status(400).json({ message: "Cannot start activity: must be within 30 minutes of scheduled time" });
        }
        const now = new Date();
        const weatherData = await (0, weather_1.getWeatherFromCity)("Braga");
        await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).update(activitySession.id, {
            startedAt: now,
            updatedAt: now,
            weatherTemperature: weatherData?.temperature ?? null,
            weatherType: weatherData?.weatherType ?? null,
            startedById: req.user?.userId
        });
        const firstStationId = await (0, actions_1.getCurrentStationId)(activitySessionId);
        if (!firstStationId) {
            return res.status(404).json({ message: "First station not found" });
        }
        const firstStation = await db_1.AppDataSource.getRepository(Station_1.Station).find({
            where: {
                id: firstStationId
            }
        });
        if (!firstStation) {
            return res.status(404).json({ message: "First station not found" });
        }
        return res.status(200).json(firstStation);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/end:
 *   post:
 *     summary: End an activity session
 *     description: Allows an instructor to end an activity session if all children have checked out and all stations are completed.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
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
 *             examples:
 *               success:
 *                 value:
 *                   message: "Activity finished successfully"
 *       400:
 *         description: Cannot finish activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_started:
 *                 value:
 *                   message: "Activity session not started yet"
 *               already_finished:
 *                 value:
 *                   message: "Activity session already finished"
 *               incomplete_checkouts:
 *                 value:
 *                   message: "Cannot finish activity: some children have incomplete check-out records"
 *               stations_in_progress:
 *                 value:
 *                   message: "Cannot finish activity: some stations are still in progress"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found"
 */
router.post('/end', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
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
        if (!activitySession.startedAt) {
            return res.status(400).json({ message: "Activity session not started yet" });
        }
        if (activitySession.finishedAt) {
            return res.status(400).json({ message: "Activity session already finished" });
        }
        const allChildStation = await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).find({
            where: { activitySessionId: activitySession.id }
        });
        const childCount = new Map();
        for (const cs of allChildStation) {
            childCount.set(cs.childId, (childCount.get(cs.childId) || 0) + 1);
        }
        const hasIncomplete = Array.from(childCount.values()).some(count => count !== 2);
        if (hasIncomplete) {
            return res.status(400).json({
                message: "Cannot finish activity: some children have incomplete check-out records"
            });
        }
        const allStationsInActivity = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).find({
            where: {
                activitySessionId: activitySessionId,
                leftAt: (0, typeorm_1.IsNull)()
            }
        });
        if (allStationsInActivity.length > 1) {
            return res.status(400).json({ message: "Cannot finish activity: some stations are still in progress" });
        }
        const stationId = allStationsInActivity[0]?.stationId;
        await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).update({
            activitySessionId: activitySessionId,
            stationId: stationId
        }, {
            leftAt: new Date()
        });
        const now = new Date();
        await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).update(activitySession.id, {
            finishedAt: now,
            updatedAt: now,
            finishedById: req.user?.userId
        });
        return res.status(200).json({ message: "Activity finished successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/station/pick-up:
 *   get:
 *     summary: Get children to pick up at current and upcoming stations
 *     description: Returns children to be picked up at the current and upcoming stations for the ongoing activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Children to pick up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 childrenToPickUp:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-1" }
 *                       name: { type: string, example: "João Silva" }
 *                 upcomingStationChildrenToPickUp:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-2" }
 *                       name: { type: string, example: "Maria Santos" }
 *             examples:
 *               example:
 *                 value:
 *                   childrenToPickUp:
 *                     - id: "child-uuid-1"
 *                       name: "João Silva"
 *                   upcomingStationChildrenToPickUp:
 *                     - id: "child-uuid-2"
 *                       name: "Maria Santos"
 *       404:
 *         description: Activity session not found or no more stations left
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session doesn't exist"
 *               no_stations:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */
router.get('/station/pick-up', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }
        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        const allStationIdsLeft = await (0, actions_1.getAllStationsLeftIds)(activitySessionId);
        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]) {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const currentStationId = allStationIdsLeft[0];
        const allChildrenLeftToPickUp = await (0, actions_1.getAllChildrenLeftToPickUp)(activitySessionId, allStationIdsLeft);
        const allChildrenToBePickedUp = await (0, actions_1.getAllChildrenByPickupStatus)(activitySessionId, currentStationId, allChildrenLeftToPickUp.currentStationChildren, false);
        return res.status(200).json({
            childrenToPickUp: (0, actions_1.stripChildStations)(allChildrenToBePickedUp),
            upcomingStationChildrenToPickUp: (0, actions_1.stripChildStations)(allChildrenLeftToPickUp.upcomingStationChildren)
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/station/still-in:
 *   get:
 *     summary: Get children still in the current station
 *     description: Returns children already picked up, to be dropped off, and yet to be dropped off at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Children still in station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allChildrenAlreadyPickedUp:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-1" }
 *                       name: { type: string, example: "João Silva" }
 *                 allChildrenToBeDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-2" }
 *                       name: { type: string, example: "Maria Santos" }
 *                 allChildrenYetToBeDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-3" }
 *                       name: { type: string, example: "Ana Costa" }
 *             examples:
 *               example:
 *                 value:
 *                   allChildrenAlreadyPickedUp:
 *                     - id: "child-uuid-1"
 *                       name: "João Silva"
 *                   allChildrenToBeDroppedOff:
 *                     - id: "child-uuid-2"
 *                       name: "Maria Santos"
 *                   allChildrenYetToBeDroppedOff:
 *                     - id: "child-uuid-3"
 *                       name: "Ana Costa"
 *       404:
 *         description: Activity session not found or no more stations left
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */
router.get('/station/still-in', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }
        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        const allStationIdsLeft = await (0, actions_1.getAllStationsLeftIds)(activitySessionId);
        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]) {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const currentStationId = allStationIdsLeft[0];
        const allChildrenPickedUpInThisStation = await (0, actions_1.getAllChildrenAtPickupStation)(activitySessionId, currentStationId);
        const allChildrenAlreadyPickedUp = await (0, actions_1.getAllChildrenByPickupStatus)(activitySessionId, currentStationId, allChildrenPickedUpInThisStation, true);
        const allChildrenToBeDroppedOff = await (0, actions_1.getAllChildrenByDroppedOffStatus)(activitySessionId, currentStationId, false);
        const allChildrenYetToBeDroppedOff = await (0, actions_1.getAllChildrenYetToBeDroppedOff)(activitySessionId, allStationIdsLeft);
        return res.status(200).json({
            allChildrenAlreadyPickedUp: (0, actions_1.stripChildStations)(allChildrenAlreadyPickedUp),
            allChildrenToBeDroppedOff: (0, actions_1.stripChildStations)(allChildrenToBeDroppedOff),
            allChildrenYetToBeDroppedOff: (0, actions_1.stripChildStations)(allChildrenYetToBeDroppedOff)
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/station/drop-off:
 *   get:
 *     summary: Get children to drop off at current station
 *     description: Returns children to be dropped off and already dropped off at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Children to drop off
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allChildrenDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-1" }
 *                       name: { type: string, example: "João Silva" }
 *                 allChildrenPreviouslyDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-2" }
 *                       name: { type: string, example: "Maria Santos" }
 *             examples:
 *               example:
 *                 value:
 *                   allChildrenDroppedOff:
 *                     - id: "child-uuid-1"
 *                       name: "João Silva"
 *                   allChildrenPreviouslyDroppedOff:
 *                     - id: "child-uuid-2"
 *                       name: "Maria Santos"
 *       404:
 *         description: Activity session not found or no more stations left
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */
router.get('/station/drop-off', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }
        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        const currentStationId = await (0, actions_1.getCurrentStationId)(activitySessionId);
        if (!currentStationId) {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const allChildrenToBeDroppedOff = await (0, actions_1.getAllChildrenByDroppedOffStatus)(activitySessionId, currentStationId, true);
        const allChildrenAlreadyDroppedOff = await (0, actions_1.getAllChildrenAlreadyDroppedOff)(activitySessionId, currentStationId);
        return res.status(200).json({
            allChildrenDroppedOff: (0, actions_1.stripChildStations)(allChildrenToBeDroppedOff),
            allChildrenPreviouslyDroppedOff: (0, actions_1.stripChildStations)(allChildrenAlreadyDroppedOff)
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/station/next-stop:
 *   post:
 *     summary: Move to the next station
 *     description: Marks the current station as completed and returns the next station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Next station info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "station-uuid-2"
 *                 name:
 *                   type: string
 *                   example: "Biblioteca Central"
 *                 type:
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-2"
 *                   name: "Biblioteca Central"
 *                   type: "regular"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: null
 *       402:
 *         description: There are still children to be dropped off or no next station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               children_pending:
 *                 value:
 *                   message: "There are still children to be dropped off at the current station"
 *               no_next_station:
 *                 value:
 *                   message: "There isn't a next station"
 *       404:
 *         description: Next station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Next station not found"
 */
router.post('/station/next-stop', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }
        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        const allStationIdsLeft = await (0, actions_1.getAllStationsLeftIds)(activitySessionId);
        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]) {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const currentStationId = allStationIdsLeft[0];
        const allChildrenToBeDroppedOff = await (0, actions_1.getAllChildrenByDroppedOffStatus)(activitySessionId, currentStationId, false);
        if (allChildrenToBeDroppedOff.length > 0) {
            return res.status(402).json({ message: "There are still children to be dropped off at the current station" });
        }
        if (allStationIdsLeft.length <= 1) {
            return res.status(402).json({ message: "There isn't a next station" });
        }
        let nextStation = await db_1.AppDataSource.getRepository(Station_1.Station).findOne({
            where: {
                id: allStationIdsLeft[1]
            }
        });
        if (!nextStation) {
            return res.status(404).json({ message: "Next station not found" });
        }
        const previousStation = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                arrivedAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
                leftAt: (0, typeorm_1.IsNull)()
            }
        });
        if (!previousStation) {
            return res.status(404).json({ message: "Cannot go to next stop yet" });
        }
        await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).update({
            activitySessionId: activitySessionId,
            stationId: previousStation.stationId
        }, {
            leftAt: new Date()
        });
        return res.status(200).json(nextStation);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/station/arrived-at-stop:
 *   post:
 *     summary: Mark arrival at current station
 *     description: Marks the instructor as arrived at the current station and returns the station info with flags.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Current station info with arrival confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "station-uuid-1"
 *                 name:
 *                   type: string
 *                   example: "Biblioteca Central"
 *                 type:
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 isLastStation:
 *                   type: boolean
 *                   example: false
 *                   description: "Indicates if this is the last station in the route"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-1"
 *                   name: "Biblioteca Central"
 *                   type: "regular"
 *                   isLastStation: false
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: null
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_id:
 *                 value:
 *                   message: "Activity session ID is required"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session doesn't exist"
 *               no_stations:
 *                 value:
 *                   message: "No more stations left"
 *               station_not_found:
 *                 value:
 *                   message: "Current station not found"
 */
router.post('/station/arrived-at-stop', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }
        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        const allStationIdsLeft = await (0, actions_1.getAllStationsLeftIds)(activitySessionId);
        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]) {
            return res.status(404).json({ message: "No more stations left" });
        }
        const currentStationId = allStationIdsLeft[0];
        const currentStation = await db_1.AppDataSource.getRepository(Station_1.Station).findOne({
            where: {
                id: allStationIdsLeft[0]
            }
        });
        if (!currentStation) {
            return res.status(404).json({ message: "Current station not found" });
        }
        const isAlreadyInAStop = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                arrivedAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
                leftAt: (0, typeorm_1.IsNull)()
            }
        });
        if (isAlreadyInAStop) {
            return res.status(404).json({ message: "Cannot move to next stop without leaving the current station" });
        }
        const currentStationWithFlag = {
            ...currentStation,
            isLastStation: allStationIdsLeft.length === 1
        };
        await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).update({
            activitySessionId: activitySessionId,
            stationId: currentStationId
        }, {
            arrivedAt: new Date()
        });
        return res.status(200).json(currentStationWithFlag);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/station/status:
 *   post:
 *     summary: Get current station status
 *     description: Returns the current station and whether it is the last station, or the activity status.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Current station info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "station-uuid-1"
 *                 name:
 *                   type: string
 *                   example: "Estação Central"
 *                 type:
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 isInStation:
 *                   type: boolean
 *                   example: true
 *                   description: "Indicates if the instructor has arrived at the station"
 *                 isLastStation:
 *                   type: boolean
 *                   example: false
 *                   description: "Indicates if this is the last station in the route"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-1"
 *                   name: "Estação Central"
 *                   type: "regular"
 *                   isInStation: true
 *                   isLastStation: false
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: null
 *       201:
 *         description: Activity ready to be ended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               ready:
 *                 value:
 *                   message: "Activity ready to be ended"
 *       202:
 *         description: Activity already ended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               ended:
 *                 value:
 *                   message: "Activity already ended"
 *       203:
 *         description: Activity not started yet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_started:
 *                 value:
 *                   message: "Activity not started yet"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_id:
 *                 value:
 *                   message: "Activity session ID is required"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *       404:
 *         description: Current station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session doesn't exist"
 *               not_found:
 *                 value:
 *                   message: "Current station not found"
 */
router.post('/station/status', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const activitySessionId = req.query.id;
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }
        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        const allStationIdsLeft = await (0, actions_1.getAllStationsLeftIds)(activitySessionId);
        if (!activitySession.startedAt) {
            return res.status(203).json({ message: "Activity not started yet" });
        }
        // Activity already ended or it is ready to end
        if (allStationIdsLeft.length === 0) {
            if (activitySession.finishedAt) {
                return res.status(202).json({ message: "Activity already ended" });
            }
            return res.status(201).json({ message: "Activity ready to be ended" });
        }
        const currentStationActivity = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                stationId: allStationIdsLeft[0],
                activitySessionId: activitySessionId
            },
            relations: {
                station: true
            }
        });
        if (!currentStationActivity) {
            return res.status(404).json({ message: "Current station not found" });
        }
        const isInStation = currentStationActivity.arrivedAt !== null && currentStationActivity.leftAt === null;
        const currentStationWithFlags = {
            ...currentStationActivity.station,
            isInStation: isInStation,
            isLastStation: allStationIdsLeft.length === 1
        };
        return res.status(200).json(currentStationWithFlags);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/actions/child/check-in:
 *   post:
 *     summary: Check in a child at the current station
 *     description: Checks in a child at the current station for the activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child checked-in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child checked-in successfully"
 *       400:
 *         description: Bad request or already checked-in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
 *               not_registered:
 *                 value:
 *                   message: "Child is not registered for this activity session in this station"
 *               already_checked_in:
 *                 value:
 *                   message: "Child already checked-in"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               child_not_found:
 *                 value:
 *                   message: "Child not found"
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session not found"
 *               no_stations:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */
router.post('/child/check-in', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({
                message: "Child ID, Station ID and Activity Session ID are required"
            });
        }
        const stationId = await (0, actions_1.getCurrentStationId)(activitySessionId);
        if (!stationId || typeof stationId !== "string") {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
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
        const child = await db_1.AppDataSource.getRepository(Child_1.Child).findOne({
            where: { id: childId }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }
        const childActivitySession = await db_1.AppDataSource.getRepository(ChildActivitySession_1.ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId,
                pickUpStationId: stationId,
            }
        });
        if (!childActivitySession) {
            return res.status(400).json({
                message: "Child is not registered for this activity session in this station"
            });
        }
        const stationActivity = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (!stationActivity) {
            return res.status(404).json({
                message: "Station not found in this activity session"
            });
        }
        const alreadyCheckedIn = await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: types_1.ChildStationType.IN
            }
        });
        if (alreadyCheckedIn) {
            return res.status(400).json({
                message: "Child already checked-in"
            });
        }
        await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).insert({
            childId: childId,
            stationId: stationId,
            type: types_1.ChildStationType.IN,
            instructorId: req.user.userId,
            activitySessionId: activitySessionId,
            registeredAt: new Date()
        });
        return res.status(200).json({ message: "Child checked-in successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * @swagger
 * /activity-session/actions/child/check-out:
 *   post:
 *     summary: Check out a child at the current station
 *     description: Checks out a child at the current station for the activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child checked-out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child checked-out successfully"
 *       400:
 *         description: Bad request or already checked-out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
 *               not_registered:
 *                 value:
 *                   message: "Child is not registered for this activity session in this station"
 *               already_checked_out:
 *                 value:
 *                   message: "Child already checked-out"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               child_not_found:
 *                 value:
 *                   message: "Child not found or not at the correct station"
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session not found"
 */
router.post('/child/check-out', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({
                message: "Child ID, Station ID and Activity Session ID are required"
            });
        }
        const stationId = await (0, actions_1.getCurrentStationId)(activitySessionId);
        if (!stationId || typeof stationId !== "string") {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
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
        const child = await db_1.AppDataSource.getRepository(Child_1.Child).findOne({
            where: {
                id: childId,
                dropOffStationId: stationId
            }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found or not at the correct station" });
        }
        const childActivitySession = await db_1.AppDataSource.getRepository(ChildActivitySession_1.ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId
            }
        });
        if (!childActivitySession) {
            return res.status(400).json({
                message: "Child is not registered for this activity session in this station"
            });
        }
        const stationActivity = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (!stationActivity) {
            return res.status(404).json({
                message: "Station not found in this activity session"
            });
        }
        const alreadyCheckedOut = await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: types_1.ChildStationType.OUT
            }
        });
        if (alreadyCheckedOut) {
            res.status(400).json({ message: "Child already checked-out" });
        }
        await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).insert({
            childId: childId,
            stationId: stationId,
            type: types_1.ChildStationType.OUT,
            instructorId: req.user.userId,
            activitySessionId: activitySessionId,
            registeredAt: new Date()
        });
        return res.status(200).json({ message: "Child checked-out successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * @swagger
 * /activity-session/actions/child/check-in:
 *   delete:
 *     summary: Undo check-in for a child at the current station
 *     description: Removes the check-in record for a child at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child unchecked-in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child uncheked-in sucessfully"
 *       400:
 *         description: Child is not checked-in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_checked_in:
 *                 value:
 *                   message: "Child is not checked-in"
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Child not found"
 */
router.delete('/child/check-in', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({
                message: "Child ID, Station ID and Activity Session ID are required"
            });
        }
        const stationId = await (0, actions_1.getCurrentStationId)(activitySessionId);
        if (!stationId || typeof stationId !== "string") {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
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
        const child = await db_1.AppDataSource.getRepository(Child_1.Child).findOne({
            where: { id: childId }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }
        const childActivitySession = await db_1.AppDataSource.getRepository(ChildActivitySession_1.ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId,
                pickUpStationId: stationId,
            }
        });
        if (!childActivitySession) {
            return res.status(400).json({
                message: "Child is not registered for this activity session in this station"
            });
        }
        const stationActivity = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (!stationActivity) {
            return res.status(404).json({
                message: "Station not found in this activity session"
            });
        }
        const alreadyCheckedIn = await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: types_1.ChildStationType.IN
            }
        });
        if (!alreadyCheckedIn) {
            return res.status(400).json({
                message: "Child is not checked-in"
            });
        }
        await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).delete({
            childId: childId,
            stationId: stationId,
            type: types_1.ChildStationType.IN,
            activitySessionId: activitySessionId
        });
        return res.status(200).json({ message: "Child uncheked-in sucessfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * @swagger
 * /activity-session/actions/child/check-out:
 *   delete:
 *     summary: Undo check-out for a child at the current station
 *     description: Removes the check-out record for a child at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child unchecked-out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child unchecked-out successfully"
 *       400:
 *         description: Child not checked-out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_checked_out:
 *                 value:
 *                   message: "Child not checked-out"
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Child not found or not at the correct station"
 */
router.delete('/child/check-out', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INSTRUCTOR), async (req, res) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({
                message: "Child ID, Station ID and Activity Session ID are required"
            });
        }
        const stationId = await (0, actions_1.getCurrentStationId)(activitySessionId);
        if (!stationId || typeof stationId !== "string") {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
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
        const child = await db_1.AppDataSource.getRepository(Child_1.Child).findOne({
            where: {
                id: childId,
                dropOffStationId: stationId
            }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found or not at the correct station" });
        }
        const childActivitySession = await db_1.AppDataSource.getRepository(ChildActivitySession_1.ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId
            }
        });
        if (!childActivitySession) {
            return res.status(400).json({
                message: "Child is not registered for this activity session in this station"
            });
        }
        const stationActivity = await db_1.AppDataSource.getRepository(StationActivitySession_1.StationActivitySession).findOne({
            where: {
                stationId: stationId,
                activitySessionId: activitySessionId
            }
        });
        if (!stationActivity) {
            return res.status(404).json({
                message: "Station not found in this activity session"
            });
        }
        const alreadyCheckedOut = await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: types_1.ChildStationType.OUT
            }
        });
        if (!alreadyCheckedOut) {
            res.status(400).json({ message: "Child not checked-out" });
        }
        await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).delete({
            childId: childId,
            stationId: stationId,
            type: types_1.ChildStationType.OUT,
            activitySessionId: activitySessionId,
        });
        return res.status(200).json({ message: "Child unchecked-out successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
