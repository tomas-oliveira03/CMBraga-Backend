import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { authenticate, authorize } from "@/server/middleware/auth";
import { getAllChildrenAlreadyDroppedOff, getAllChildrenAtPickupStation, getAllChildrenByDroppedOffStatus, getAllChildrenByPickupStatus, getAllChildrenLeftToPickUp, getAllChildrenYetToBeDroppedOff, getAllStationsLeftIds, getCurrentStation, getCurrentStationId, stripChildData } from "@/server/services/actions";
import { ChildStationType, UserNotificationType, UserRole } from "@/helpers/types";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { Station } from "@/db/entities/Station";
import { Child } from "@/db/entities/Child";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ChildStation } from "@/db/entities/ChildStation";
import { IsNull, Not } from "typeorm";
import { getWeatherFromCity } from "@/server/services/weather";
import { setActivityStats } from "@/server/services/activityStats";
import { Parent } from "@/db/entities/Parent";
import { ParentActivitySession } from "@/db/entities/ParentActivitySession";
import { ParentStation } from "@/db/entities/ParentStation";
import { awardBadgesAfterActivity } from "@/server/services/badge";
import { setAllInstructorsInActivityRedis } from "@/server/services/activity";
import { webSocketEvents } from "@/server/services/websocket-events";
import { ClientType, RequestType } from "@/helpers/websocket-types";
import { createNotificationForUser } from "@/server/services/notification";

const router = express.Router();


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

        const firstStation = await getCurrentStation(activitySessionId)
        if (!firstStation){
            return res.status(404).json({ message: "First station not found" });
        }

        const now = new Date();
        const weatherData = await getWeatherFromCity("Braga")

        await AppDataSource.getRepository(ActivitySession).update(activitySession.id, { 
            startedAt: now, 
            updatedAt: now,
            weatherTemperature: weatherData?.temperature ?? null,
            weatherType: weatherData?.weatherType ?? null,
            startedById: req.user?.userId 
        });

        await setAllInstructorsInActivityRedis(activitySessionId)

        const stationData = {
            id: firstStation.id,
            name: firstStation.name,
            type: firstStation.type,
            latitude: firstStation.latitude,
            longitude: firstStation.longitude
        }
        webSocketEvents.sendActivityStarted(activitySessionId, req.user!.email, stationData)

        return res.status(200).json(stationData);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


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
                leftAt: IsNull()
            }
        })

        if(allStationsInActivity.length>1){
            return res.status(400).json({ message: "Cannot finish activity: some stations are still in progress" });
        }

        const stationId = allStationsInActivity[0]?.stationId;

        await AppDataSource.transaction(async tx => {
            await tx.getRepository(StationActivitySession).update(
                {
                    activitySessionId: activitySessionId,
                    stationId: stationId
                },
                {
                    leftAt: new Date()
                }
            )

            const now = new Date();
            await tx.getRepository(ActivitySession).update(activitySession.id, { 
                finishedAt: now,
                updatedAt: now,
                finishedById: req.user?.userId
            });
        })

        setActivityStats(activitySessionId)
        await awardBadgesAfterActivity(activitySessionId);
        webSocketEvents.sendActivityEnded(activitySessionId, req.user!.email);


        return res.status(200).json({ message: "Activity finished successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});



router.get('/station/pick-up', authenticate, authorize(UserRole.INSTRUCTOR, UserRole.ADMIN), async (req: Request, res: Response) => {
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

        if (req.user?.role !== UserRole.ADMIN && !(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeftIds(activitySessionId)

        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const currentStationId = allStationIdsLeft[0]

        const allChildrenLeftToPickUp = await getAllChildrenLeftToPickUp(activitySessionId, allStationIdsLeft)

        const allChildrenToBePickedUp = await getAllChildrenByPickupStatus(activitySessionId, currentStationId, allChildrenLeftToPickUp.currentStationChildren, false)
        
        return res.status(200).json({
            childrenToPickUp: stripChildData(allChildrenToBePickedUp),
            upcomingStationChildrenToPickUp: stripChildData(allChildrenLeftToPickUp.upcomingStationChildren)
        })

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});



router.get('/station/still-in', authenticate, authorize(UserRole.INSTRUCTOR, UserRole.ADMIN), async (req: Request, res: Response) => {
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

        if (req.user?.role !== UserRole.ADMIN && !(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeftIds(activitySessionId)

        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const currentStationId = allStationIdsLeft[0]
        
        const allChildrenPickedUpInThisStation = await getAllChildrenAtPickupStation(activitySessionId, currentStationId)

        const allChildrenAlreadyPickedUp = await getAllChildrenByPickupStatus(activitySessionId, currentStationId, allChildrenPickedUpInThisStation, true)
        
        const allChildrenToBeDroppedOff = await getAllChildrenByDroppedOffStatus(activitySessionId, currentStationId, false)

        const allChildrenYetToBeDroppedOff = await getAllChildrenYetToBeDroppedOff(activitySessionId, allStationIdsLeft)

        return res.status(200).json({
            allChildrenAlreadyPickedUp: stripChildData(allChildrenAlreadyPickedUp),
            allChildrenToBeDroppedOff: stripChildData(allChildrenToBeDroppedOff),
            allChildrenYetToBeDroppedOff: stripChildData(allChildrenYetToBeDroppedOff)
        })

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});



router.get('/station/drop-off', authenticate, authorize(UserRole.INSTRUCTOR, UserRole.ADMIN),async (req: Request, res: Response) => {
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

        if (req.user?.role !== UserRole.ADMIN && !(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const currentStationId = await getCurrentStationId(activitySessionId)

        if (!currentStationId){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const allChildrenToBeDroppedOff = await getAllChildrenByDroppedOffStatus(activitySessionId, currentStationId, true)

        const allChildrenAlreadyDroppedOff = await getAllChildrenAlreadyDroppedOff(activitySessionId, currentStationId)

        return res.status(200).json({
            allChildrenDroppedOff: stripChildData(allChildrenToBeDroppedOff),
            allChildrenPreviouslyDroppedOff: stripChildData(allChildrenAlreadyDroppedOff)
        })

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
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

        if (!activitySession.startedAt){
            return res.status(404).json({ message: "Activity session hasn't started yet" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeftIds(activitySessionId)

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


        const previousStation = await AppDataSource.getRepository(StationActivitySession).findOne({
            where: {
                activitySessionId: activitySessionId,
                arrivedAt: Not(IsNull()),
                leftAt: IsNull()
            }
        })

        if(!previousStation){
            return res.status(404).json({ message: "Cannot go to next stop yet" });
        }

        await AppDataSource.getRepository(StationActivitySession).update(
            {
                activitySessionId: activitySessionId,
                stationId: previousStation.stationId
            },
            {
                leftAt: new Date()
            }
        )
        
        const stationData = {
            id: nextStation.id,
            name: nextStation.name,
            type: nextStation.type,
            latitude: nextStation.latitude,
            longitude: nextStation.longitude
        }

        webSocketEvents.sendActivityNextStop(activitySessionId, req.user!.email, stationData)

        return res.status(200).json(stationData)
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/station/arrived-at-stop', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
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

        if (!activitySession.startedAt){
            return res.status(404).json({ message: "Activity session hasn't started yet" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allStationIdsLeft = await getAllStationsLeftIds(activitySessionId)

        if (allStationIdsLeft.length === 0 || !allStationIdsLeft[0]){
            return res.status(404).json({ message: "No more stations left" });
        }

        const currentStationId = allStationIdsLeft[0]

        const currentStation = await AppDataSource.getRepository(Station).findOne({
            where: {
                id: allStationIdsLeft[0]
            }
        })

        if (!currentStation){
            return res.status(404).json({ message: "Current station not found" });
        }

        const isAlreadyInAStop = await AppDataSource.getRepository(StationActivitySession).findOne({
            where: {
                activitySessionId: activitySessionId,
                arrivedAt: Not(IsNull()),
                leftAt: IsNull()
            }
        });

        if(isAlreadyInAStop){
            return res.status(404).json({ message: "Cannot move to next stop without leaving the current station" });
        }


        type StationWithFlag = Station & { isLastStation: boolean };

        const currentStationWithFlag: StationWithFlag = {
            ...currentStation,
            isLastStation: allStationIdsLeft.length === 1
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

        const stationData = {
            id: currentStationWithFlag.id,
            name: currentStationWithFlag.name,
            type: currentStationWithFlag.type,
            latitude: currentStationWithFlag.latitude,
            longitude: currentStationWithFlag.longitude,
            isLastStation: currentStationWithFlag.isLastStation
        }

        webSocketEvents.sendActivityArrivedAtStop(activitySessionId, req.user!.email, stationData)

        return res.status(200).json(stationData)
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/station/status', authenticate, authorize(UserRole.INSTRUCTOR, UserRole.ADMIN), async (req: Request, res: Response) => {
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

        if (req.user?.role !== UserRole.ADMIN && !(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        
        const allStationIdsLeft = await getAllStationsLeftIds(activitySessionId)
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

        const currentStationActivity = await AppDataSource.getRepository(StationActivitySession).findOne({
            where: {
                stationId: allStationIdsLeft[0],
                activitySessionId: activitySessionId
            },
            relations: {
                station: true
            }
        })

        if (!currentStationActivity){
            return res.status(404).json({ message: "Current station not found" });
        }

        const isInStation = currentStationActivity.arrivedAt !== null && currentStationActivity.leftAt === null

        type StationWithFlags = Station & { isInStation: boolean; isLastStation: boolean };

        const currentStationWithFlags: StationWithFlags = {
            ...currentStationActivity.station,
            isInStation: isInStation,
            isLastStation: allStationIdsLeft.length === 1
        };

        return res.status(200).json({
            id: currentStationWithFlags.id,
            name: currentStationWithFlags.name,
            type: currentStationWithFlags.type,
            latitude: currentStationWithFlags.latitude,
            longitude: currentStationWithFlags.longitude,
            isInStation: currentStationWithFlags.isInStation,
            isLastStation: currentStationWithFlags.isLastStation,
        })
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
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
        const station = await getCurrentStation(activitySessionId)
        
        if (!station){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations: {
                instructorActivitySessions: true,
                route: true
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
                pickUpStationId: station.id, 
            }
        });

        if (!childActivitySession) {
            return res.status(400).json({ 
                message: "Child is not registered for this activity session in this station" 
            });
        }

        const stationActivity = await AppDataSource.getRepository(StationActivitySession).findOne({
            where: {
                stationId: station.id,
                activitySessionId: activitySessionId
            }
        });

        if (!stationActivity) {
            return res.status(404).json({ 
                message: "Station not found in this activity session" 
            });
        }

        if(!stationActivity.arrivedAt){
            return res.status(400).json({ message: "Instructor has not arrived at this station yet" });
        }

        const alreadyCheckedIn = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: childId,
                stationId: station.id,
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
            stationId: station.id,
            type: ChildStationType.IN,
            instructorId: req.user!.userId,
            activitySessionId: activitySessionId,
            registeredAt: new Date()
        });

        webSocketEvents.sendActivityCheckedIn(activitySessionId, req.user!.email, RequestType.ADD, ClientType.CHILD, childId);
        createNotificationForUser({
            type: UserNotificationType.CHILD_CHECKED_IN,
            child: {
                id: childId,
                name: child.name
            },
            activitySession: {
                id: activitySessionId,
                type: activitySession.type,
                routeName: activitySession.route.name,
                stationName: station.name
            }
        })

        return res.status(200).json({message: "Child checked-in successfully"});

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
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
        
        const station = await getCurrentStation(activitySessionId)
        
        if (!station){
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }


        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations: {
                instructorActivitySessions: true,
                route: true
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
                id: childId
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
                stationId: station.id,
                activitySessionId: activitySessionId
            },
            relations:{
                station: true
            }
        });

        if (!stationActivity) {
            return res.status(404).json({ 
                message: "Station not found in this activity session" 
            });
        }

        if(!stationActivity.arrivedAt){
            return res.status(400).json({ message: "Instructor has not arrived at this station yet" });
        }

        const alreadyCheckedOut = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: childId,
                stationId: station.id,
                activitySessionId: activitySessionId,
                type: ChildStationType.OUT

            }
        })

        if(alreadyCheckedOut){
            return res.status(400).json({ message : "Child already checked-out"})
        }

        await AppDataSource.getRepository(ChildStation).insert({
            childId: childId,
            stationId: station.id,
            type: ChildStationType.OUT,
            instructorId: req.user!.userId,
            activitySessionId: activitySessionId,
            registeredAt: new Date()
        });
 
        webSocketEvents.sendActivityCheckedOut(activitySessionId, req.user!.email, RequestType.ADD, childId);
        createNotificationForUser({
            type: UserNotificationType.CHILD_CHECKED_OUT,
            child: {
                id: childId,
                name: child.name
            },
            activitySession: {
                id: activitySessionId,
                type: activitySession.type,
                routeName: activitySession.route.name,
                stationName: station.name
            }
        })
        return res.status(200).json({message: "Child checked-out successfully"});

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
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
        const stationId = await getCurrentStationId(activitySessionId)
        
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
        
        webSocketEvents.sendActivityCheckedIn(activitySessionId, req.user!.email, RequestType.REMOVE, ClientType.CHILD, childId);

        return res.status(200).json({message: "Child uncheked-in sucessfully"});

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
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
        const stationId = await getCurrentStationId(activitySessionId)
        
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

        const child = await AppDataSource.getRepository(ChildActivitySession).findOne({
            where: { 
                childId: childId,
                activitySessionId: activitySessionId,
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
            return res.status(400).json({ message : "Child not checked-out"})
        }

        await AppDataSource.getRepository(ChildStation).delete({
            childId: childId,
            stationId: stationId,
            type: ChildStationType.OUT,
            activitySessionId: activitySessionId,
        });

        webSocketEvents.sendActivityCheckedOut(activitySessionId, req.user!.email, RequestType.REMOVE, childId);

        return res.status(200).json({message: "Child unchecked-out successfully"});

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});



router.get('/child/allActivities', authenticate, authorize(UserRole.PARENT, UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const childId = req.query.childId;

        if (!childId || typeof childId !== "string") {
            return res.status(400).json({ message: "Child ID is required" });
        }

        const childActivities = await AppDataSource.getRepository(ChildActivitySession).find({
            where: {
                childId: childId
            },
            relations: {
                activitySession: true,
                child: {
                    parentChildren: true
                }
            }
        });
        if (req.user!.role === UserRole.PARENT && !childActivities.some(ca => ca.child.parentChildren.some(pc => pc.parentId === req.user!.userId))) {
            return res.status(403).json({ message: "You do not have access to this child's activities" });
        }

        return res.status(200).json(childActivities.map(ca => ca.activitySession));

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});



router.post('/parent/check-in', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const parentId = req.query.parentId;
        const activitySessionId = req.query.activitySessionId;

        if (!parentId || !activitySessionId || typeof parentId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({ 
                message: "Parent ID, Station ID and Activity Session ID are required" 
            });
        }
        const stationId = await getCurrentStationId(activitySessionId)
        
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

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        const parentActivitySession = await AppDataSource.getRepository(ParentActivitySession).findOne({
            where: {
                parentId: parentId,
                activitySessionId: activitySessionId,
            }
        });
        if (!parentActivitySession) {
            return res.status(400).json({ 
                message: "Parent is not registered for this activity session in this station" 
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

        if(!stationActivity.arrivedAt){
            return res.status(400).json({ message: "Instructor has not arrived at this station yet" });
        }

        const alreadyCheckedIn = await AppDataSource.getRepository(ParentStation).findOne({
            where: {
                parentId: parentId,
                activitySessionId: activitySessionId
            }
        });
        if (alreadyCheckedIn){
            return res.status(400).json({
                message: "Parent already checked-in"
            });
        }

        await AppDataSource.getRepository(ParentStation).insert({
            parentId: parentId,
            instructorId: req.user!.userId,
            activitySessionId: activitySessionId,
            registeredAt: new Date()
        });

        webSocketEvents.sendActivityCheckedIn(activitySessionId, req.user!.email, RequestType.ADD, ClientType.PARENT, parentId);

        return res.status(200).json({message: "Parent checked-in successfully"});

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.delete('/parent/check-in', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const parentId = req.query.childId;
        const activitySessionId = req.query.activitySessionId;

        if (!parentId || !activitySessionId || typeof parentId !== "string" || typeof activitySessionId !== "string") {
            return res.status(400).json({
                message: "Parent ID, Station ID and Activity Session ID are required"
            });
        }
        const stationId = await getCurrentStationId(activitySessionId)
        
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

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        const parentActivitySession = await AppDataSource.getRepository(ParentActivitySession).findOne({
            where: {
                parentId: parentId,
                activitySessionId: activitySessionId
            }
        });
        if (!parentActivitySession) {
            return res.status(400).json({
                message: "Parent is not registered for this activity session in this station"
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

        const alreadyCheckedIn = await AppDataSource.getRepository(ParentStation).findOne({
            where: {
                parentId: parentId,
                activitySessionId: activitySessionId
            }
        });
        if (!alreadyCheckedIn){
            return res.status(400).json({
                message: "Parent is not checked-in"
            });
        }

        await AppDataSource.getRepository(ParentStation).delete({
            parentId: parentId,
            activitySessionId: activitySessionId
        });

        webSocketEvents.sendActivityCheckedIn(activitySessionId, req.user!.email, RequestType.REMOVE, ClientType.PARENT, parentId);

        return res.status(200).json({message: "Parent unchecked-in successfully"});

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/parentStatus', authenticate, authorize(UserRole.INSTRUCTOR, UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.activitySessionId;

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

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if (req.user?.role !== UserRole.ADMIN && !(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        const allParentsInActivity = await AppDataSource.getRepository(ParentActivitySession).find({
            where: {
                activitySessionId: activitySessionId
            },
            relations: {
                parent: true
            }
        });

        const checkedInParents = await AppDataSource.getRepository(ParentStation).find({
            where: {
                activitySessionId: activitySessionId
            },
            relations: {
                parent: true
            }
        });

        const checkedInParentIds = new Set(checkedInParents.map(ps => ps.parentId));

        const parentsCheckedIn = checkedInParents.map(ps => ({
            id: ps.parent.id,
            name: ps.parent.name
        }));

        const parentsYetToCheckIn = allParentsInActivity
            .filter(pas => !checkedInParentIds.has(pas.parentId))
            .map(pas => ({
                id: pas.parent.id,
                name: pas.parent.name
            }));

        return res.status(200).json({
            parentsCheckedIn,
            parentsYetToCheckIn
        });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
