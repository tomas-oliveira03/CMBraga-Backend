import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { authenticate, authorize } from "@/server/middleware/auth";
import { getAllChildrenAlreadyDroppedOff, getAllChildrenAtPickupStation, getAllChildrenByDroppedOffStatus, getAllChildrenByPickupStatus, getAllChildrenLeftToPickUp, getAllChildrenYetToBeDroppedOff, getAllStationsLeft, getCurrentStation, stripChildStations } from "@/server/services/actions";
import { ChildStationType, UserRole } from "@/helpers/types";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { Station } from "@/db/entities/Station";
import { Child } from "@/db/entities/Child";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ChildStation } from "@/db/entities/ChildStation";
import { IsNull } from "typeorm";

const router = express.Router();

// TODO: Create UserStat after ending an activity session, for parent and child, be careful, there can be multiple parents for one child

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
router.post('/start', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;

        if(!activitySessionId || typeof activitySessionId !== "string"){
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({ 
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
        await AppDataSource.getRepository(ActivitySession).update(activitySession.id, { 
            startedAt: now, 
            updatedAt: now,
            startedById: req.user?.userId 
        });

        return res.status(200).json({ message: "Activity started successfully" });
    } catch (error) {
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
router.post('/end', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;

        if(!activitySessionId || typeof activitySessionId !== "string"){
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({ 
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

        const allChildStation = await AppDataSource.getRepository(ChildStation).find({
            where: { activitySessionId: activitySession.id }
        });

        const childCount = new Map<string, number>();

        for (const cs of allChildStation) {
        childCount.set(cs.childId, (childCount.get(cs.childId) || 0) + 1);
        }

        const hasIncomplete = Array.from(childCount.values()).some(count => count !== 2);

        if (hasIncomplete) {
        return res.status(400).json({
            message: "Cannot finish activity: some children have incomplete check-out records"
        });
        }

        const allStationsInActivity = await AppDataSource.getRepository(StationActivitySession).find({
            where:{
                activitySessionId: activitySessionId,
                arrivedAt: IsNull()
            }
        })

        if(allStationsInActivity.length>1){
            return res.status(400).json({ message: "Cannot finish activity: some stations are still in progress" });
        }

        const stationId = allStationsInActivity[0]?.stationId;

        await AppDataSource.getRepository(StationActivitySession).update(
            {
                activitySessionId: activitySessionId,
                stationId: stationId
            },
            {
                arrivedAt: new Date()
            }
        )

        const now = new Date();
        await AppDataSource.getRepository(ActivitySession).update(activitySession.id, { 
            finishedAt: now,
            updatedAt: now,
            finishedById: req.user?.userId
        });



        return res.status(200).json({ message: "Activity finished successfully" });
    } catch (error) {
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
router.get('/station/pick-up', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;
        
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        })

        if (!activitySession){
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeft(activitySessionId)

        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const currentStationId = allStationIdsLeft[0]

        const allChildrenLeftToPickUp = await getAllChildrenLeftToPickUp(activitySessionId, allStationIdsLeft)

        const allChildrenToBePickedUp = await getAllChildrenByPickupStatus(activitySessionId, currentStationId, allChildrenLeftToPickUp.currentStationChildren, false)
        
        return res.status(200).json({
            childrenToPickUp: stripChildStations(allChildrenToBePickedUp),
            upcomingStationChildrenToPickUp: stripChildStations(allChildrenLeftToPickUp.upcomingStationChildren)
        })

    } catch (error) {
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
router.get('/station/still-in', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;
        
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        })

        if (!activitySession){
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeft(activitySessionId)

        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const currentStationId = allStationIdsLeft[0]
        
        const allChildrenPickedUpInThisStation = await getAllChildrenAtPickupStation(activitySessionId, currentStationId)

        const allChildrenAlreadyPickedUp = await getAllChildrenByPickupStatus(activitySessionId, currentStationId, allChildrenPickedUpInThisStation, true)
        
        const allChildrenToBeDroppedOff = await getAllChildrenByDroppedOffStatus(activitySessionId, currentStationId, false)

        const allChildrenYetToBeDroppedOff = await getAllChildrenYetToBeDroppedOff(activitySessionId, allStationIdsLeft)

        return res.status(200).json({
            allChildrenAlreadyPickedUp: stripChildStations(allChildrenAlreadyPickedUp),
            allChildrenToBeDroppedOff: stripChildStations(allChildrenToBeDroppedOff),
            allChildrenYetToBeDroppedOff: stripChildStations(allChildrenYetToBeDroppedOff)
        })

    } catch (error) {
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
router.get('/station/drop-off', authenticate, authorize(UserRole.INSTRUCTOR),async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;
        
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        })

        if (!activitySession){
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const currentStationId = await getCurrentStation(activitySessionId)

        if (!currentStationId){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const allChildrenToBeDroppedOff = await getAllChildrenByDroppedOffStatus(activitySessionId, currentStationId, true)

        const allChildrenAlreadyDroppedOff = await getAllChildrenAlreadyDroppedOff(activitySessionId, currentStationId)

        return res.status(200).json({
            allChildrenDroppedOff: stripChildStations(allChildrenToBeDroppedOff),
            allChildrenPreviouslyDroppedOff: stripChildStations(allChildrenAlreadyDroppedOff)
        })

    } catch (error) {
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
 *                 id: { type: string, example: "station-uuid-2" }
 *                 name: { type: string, example: "Biblioteca Central" }
 *                 type: { type: string, enum: [regular, school], example: "regular" }
 *                 isLastStation: { type: boolean, example: false }
 *                 createdAt: { type: string, format: date-time, example: "2024-01-15T10:30:00.000Z" }
 *                 updatedAt: { type: string, format: date-time, nullable: true, example: null }
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-2"
 *                   name: "Biblioteca Central"
 *                   type: "regular"
 *                   isLastStation: false
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
router.post('/station/next-stop', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;

        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        })

        if (!activitySession){
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeft(activitySessionId)

        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const currentStationId = allStationIdsLeft[0]

        const allChildrenToBeDroppedOff = await getAllChildrenByDroppedOffStatus(activitySessionId, currentStationId, false)

        if (allChildrenToBeDroppedOff.length > 0){
            return res.status(402).json({ message: "There are still children to be dropped off at the current station" });
        }

        

        if (allStationIdsLeft.length <= 1){
            return res.status(402).json({ message: "There isn't a next station" });
        }


        let nextStation = await AppDataSource.getRepository(Station).findOne({
            where: {
                id: allStationIdsLeft[1]
            }
        })

        if (!nextStation){
            return res.status(404).json({ message: "Next station not found" });
        }

        type StationWithFlag = Station & { isLastStation: boolean };

        const nextStationWithFlag: StationWithFlag = {
            ...nextStation,
            isLastStation: allStationIdsLeft.length === 2
        };

        await AppDataSource.getRepository(StationActivitySession).update(
            {
                activitySessionId: activitySessionId,
                stationId: currentStationId
            },
            {
                arrivedAt: new Date()
            }
        )

        return res.status(200).json(nextStationWithFlag)
        
    } catch (error) {
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
 *                 id: { type: string, example: "station-uuid-1" }
 *                 name: { type: string, example: "Estação Central" }
 *                 type: { type: string, enum: [regular, school], example: "regular" }
 *                 isLastStation: { type: boolean, example: false }
 *                 createdAt: { type: string, format: date-time, example: "2024-01-15T10:30:00.000Z" }
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-1"
 *                   name: "Estação Central"
 *                   type: "regular"
 *                   isLastStation: false
 *                   createdAt: "2024-01-15T10:30:00.000Z"
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
 *               not_found:
 *                 value:
 *                   message: "Current station not found"
 */
router.post('/station/status', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;

        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activitySessionId
            }, relations: {
                instructorActivitySessions: true
            }
        })

        if (!activitySession){
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeft(activitySessionId)

         if (!activitySession.startedAt){
            return res.status(203).json({ message: "Activity not started yet" });

        }

        // Activity already ended or it is ready to end
        if (allStationIdsLeft.length === 0){
            if(activitySession.finishedAt){
                return res.status(202).json({ message: "Activity already ended" });
            }

            return res.status(201).json({ message: "Activity ready to be ended" });
        }

        const currentStation = await AppDataSource.getRepository(Station).findOne({
            where: {
                id: allStationIdsLeft[0]
            }
        })

        if (!currentStation){
            return res.status(404).json({ message: "Current station not found" });
        }

        type StationWithFlag = Station & { isLastStation: boolean };

        const currentStationWithFlag: StationWithFlag = {
            ...currentStation,
            isLastStation: allStationIdsLeft.length === 1
        };

        return res.status(200).json(currentStationWithFlag)
        
    } catch (error) {
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
router.post('/child/check-in', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({ 
                message: "Child ID, Station ID and Activity Session ID are required" 
            });
        }
        const stationId = await getCurrentStation(activitySessionId)
        
        if (!stationId || typeof stationId !== "string"){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
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

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        const childActivitySession = await AppDataSource.getRepository(ChildActivitySession).findOne({
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

        const stationActivity = await AppDataSource.getRepository(StationActivitySession).findOne({
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

        const alreadyCheckedIn = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: ChildStationType.IN
            }
        });

        if (alreadyCheckedIn){
            return res.status(400).json({
                message: "Child already checked-in"
            });
        }


        await AppDataSource.getRepository(ChildStation).insert({
            childId: childId,
            stationId: stationId,
            type: ChildStationType.IN,
            instructorId: req.user!.userId,
            activitySessionId: activitySessionId,
            registeredAt: new Date()
        });

        return res.status(200).json({message: "Child checked-in successfully"});

    } catch (error) {
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
router.post('/child/check-out', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({ 
                message: "Child ID, Station ID and Activity Session ID are required" 
            });
        }
        const stationId = await getCurrentStation(activitySessionId)
        
        if (!stationId || typeof stationId !== "string"){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }


        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
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

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { 
                id: childId,
                dropOffStationId: stationId
            }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found or not at the correct station" });
        }

        const childActivitySession = await AppDataSource.getRepository(ChildActivitySession).findOne({
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

        const stationActivity = await AppDataSource.getRepository(StationActivitySession).findOne({
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

        const alreadyCheckedOut = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: ChildStationType.OUT

            }
        })

        if(alreadyCheckedOut){
            res.status(400).json({ message : "Child already checked-out"})
        }

        await AppDataSource.getRepository(ChildStation).insert({
            childId: childId,
            stationId: stationId,
            type: ChildStationType.OUT,
            instructorId: req.user!.userId,
            activitySessionId: activitySessionId,
            registeredAt: new Date()
        });

        return res.status(200).json({message: "Child checked-out successfully"});

    } catch (error) {
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
router.delete('/child/check-in', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({ 
                message: "Child ID, Station ID and Activity Session ID are required" 
            });
        }
        const stationId = await getCurrentStation(activitySessionId)
        
        if (!stationId || typeof stationId !== "string"){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
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

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        const childActivitySession = await AppDataSource.getRepository(ChildActivitySession).findOne({
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

        const stationActivity = await AppDataSource.getRepository(StationActivitySession).findOne({
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

        const alreadyCheckedIn = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: ChildStationType.IN
            }
        });

        if (!alreadyCheckedIn){
            return res.status(400).json({
                message: "Child is not checked-in"
            });
        }


        await AppDataSource.getRepository(ChildStation).delete({
            childId: childId,
            stationId: stationId,
            type: ChildStationType.IN,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({message: "Child uncheked-in sucessfully"});

    } catch (error) {
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
router.delete('/child/check-out', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const childId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;
        
        if (!childId || !activitySessionId || typeof childId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({ 
                message: "Child ID, Station ID and Activity Session ID are required" 
            });
        }
        const stationId = await getCurrentStation(activitySessionId)
        
        if (!stationId || typeof stationId !== "string"){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }


        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
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

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { 
                id: childId,
                dropOffStationId: stationId
            }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found or not at the correct station" });
        }

        const childActivitySession = await AppDataSource.getRepository(ChildActivitySession).findOne({
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

        const stationActivity = await AppDataSource.getRepository(StationActivitySession).findOne({
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

        const alreadyCheckedOut = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: childId,
                stationId: stationId,
                activitySessionId: activitySessionId,
                type: ChildStationType.OUT
            }
        })

        if(!alreadyCheckedOut){
            res.status(400).json({ message : "Child not checked-out"})
        }

        await AppDataSource.getRepository(ChildStation).delete({
            childId: childId,
            stationId: stationId,
            type: ChildStationType.OUT,
            activitySessionId: activitySessionId,
        });

        return res.status(200).json({message: "Child unchecked-out successfully"});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});


export default router;
