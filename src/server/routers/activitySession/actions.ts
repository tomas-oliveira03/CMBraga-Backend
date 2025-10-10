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
