import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { authenticate, authorize } from "@/server/middleware/auth";
import { getAllChildrenAlreadyDroppedOff, getAllChildrenAtPickupStation, getAllChildrenByDroppedOffStatus, getAllChildrenByPickupStatus, getAllChildrenLeftToPickUp, getAllChildrenYetToBeDroppedOff, getAllStationsLeft, getCurrentStation, stripChildStations } from "@/server/services/actions";
import { UserRole } from "@/helpers/types";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { Station } from "@/db/entities/Station";

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
router.post('/start/:id', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
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
        await activity.update(activitySession.id, { 
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
router.post('/end/:id', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
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
        await activity.update(activitySession.id, { 
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


router.get('/station/pick-up', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;
        
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
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


router.get('/station/still-in', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;
        
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
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


router.get('/station/drop-off', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;
        
        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
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


router.post('/station/next-stop', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.body.id;

        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
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

        await AppDataSource.getRepository(StationActivitySession).update(
            {
                activitySessionId: activitySessionId,
                stationId: currentStationId
            },
            {
                arrivedAt: new Date()
            }
        )

        if (allChildrenToBeDroppedOff.length <= 1){
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

        return res.status(200).json(nextStationWithFlag)
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


router.post('/station/status', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.body.id;

        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activitySessionId
            }
        })

        if (!activitySession){
            return res.status(404).json({ message: "Activity session doesn't exist" });
        }

        const allStationIdsLeft = await getAllStationsLeft(activitySessionId)

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



export default router;
