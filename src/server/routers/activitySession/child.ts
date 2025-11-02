import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Child } from "@/db/entities/Child";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ParentChild } from "@/db/entities/ParentChild";
import { UserRole } from "@/helpers/types";
import { authenticate, authorize } from "@/server/middleware/auth";
import { In } from "typeorm";
import { RouteConnection } from "@/db/entities/RouteConnection";

const router = express.Router();

router.get('/:id', async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
}); 


router.get('/available-stations/:id', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const childId = req.query.childId;

        if (!childId || typeof childId !== 'string') {
            return res.status(400).json({ message: "ChildId is required" });
        }
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations: {
                stationActivitySessions: {
                    station: true
                },
                route: true,
                activityTransfer: {
                    stationActivitySessions: {
                        station: true
                    },
                    route: true,
                    activityTransfer: true
                }
            }
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

        if (!activitySession.activityTransferId) {
            const dropOffStationActivity = activitySession.stationActivitySessions.find(
                sas => sas.stationId === child.dropOffStationId
            );
            if (!dropOffStationActivity) {
                return res.status(400).json({ message: "Child's drop-off station not found in this activity session" });
            }
            
            const stationsWithAvailability = activitySession.stationActivitySessions
                .sort((a, b) => a.stopNumber - b.stopNumber)
                .map(sas => ({
                    stopNumber: sas.stopNumber,
                    isAvailable: sas.stopNumber < dropOffStationActivity.stopNumber,
                    id: sas.station.id,
                    name: sas.station.name,
                    type: sas.station.type,
                    isTransferStation: false
                }));
            
            return res.status(200).json(stationsWithAvailability);
        }

        let currentSession = activitySession;
        const result: any[] = [];

        const routeConnector = await AppDataSource.getRepository(RouteConnection).findOne({
            where: {
                fromRouteId: currentSession.routeId,
                toRouteId: currentSession.activityTransfer!.routeId
            }
        });

        if (!routeConnector) {
            return res.status(400).json({ 
                message: `Route connection not found from ${currentSession.routeId} to ${currentSession.activityTransfer!.routeId}` 
            });
        }

        const transferStationActivity = currentSession.stationActivitySessions.find(
            sas => sas.stationId === routeConnector.stationId
        );

        if (!transferStationActivity) {
            return res.status(400).json({ 
                message: `Transfer station not found in route ${currentSession.route.name}` 
            });
        }

        const stationsWithAvailability = currentSession.stationActivitySessions
            .sort((a, b) => a.stopNumber - b.stopNumber)
            .map(sas => ({
                stopNumber: sas.stopNumber,
                isAvailable: sas.stopNumber <= transferStationActivity.stopNumber,
                id: sas.station.id,
                name: sas.station.name,
                type: sas.station.type,
                isTransferStation: sas.stationId === routeConnector.stationId
            }));

        result.push(stationsWithAvailability);

        
        const nextSession = await AppDataSource.getRepository(ActivitySession).findOne({
                where: { id: currentSession.activityTransferId! },
                relations: {
                    stationActivitySessions: {
                        station: true
                    },
                    route: true,
                    activityTransfer: {
                        stationActivitySessions: {
                            station: true
                        },
                        route: true,
                        activityTransfer: true
                    }
                }
            });

        if (!nextSession) {
            return res.status(400).json({ 
                message: `Next activity session not found: ${currentSession.activityTransferId}` 
            });
        }

        const dropOffStationActivity = nextSession.stationActivitySessions.find(
            sas => sas.stationId === child.dropOffStationId
        );
        
        if (!dropOffStationActivity) {
            return res.status(400).json({ message: "Child's drop-off station not found in this activity session" });
        }

        const finalStations = nextSession.stationActivitySessions
            .sort((a, b) => a.stopNumber - b.stopNumber)
            .map(sas => ({
                stopNumber: sas.stopNumber,
                isAvailable: sas.stopNumber < dropOffStationActivity.stopNumber,
                id: sas.station.id,
                name: sas.station.name,
                type: sas.station.type,
                isTransferStation: false
            }));

        result.push(finalStations);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/all/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try{
        const activityId = req.params.id;

        const allChildren = await AppDataSource.getRepository(ParentChild).find({
            where:{
                parentId: req.user?.userId
            },
            relations:{
                child: true
            }
        })

        const activitySession = await AppDataSource.getRepository(ChildActivitySession).find({
            where:{
                activitySessionId: activityId,
                childId: In(allChildren.map(ac => ac.childId))
            }
        })

        const childrenWithFlags = allChildren.map(ac => {
            const isRegistered = activitySession.some(cas => cas.childId === ac.childId);
            return {
                childId: ac.childId,
                childName: ac.child.name,
                profilePictureURL: ac.child.profilePictureURL,
                isRegistered: isRegistered
            };
        });

        return res.status(200).json(childrenWithFlags);
    } catch(error){
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }                   
});


router.post('/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { childId, pickUpStationId } = req.body;

        if (!childId || !pickUpStationId || typeof childId !== 'string' || typeof pickUpStationId !== 'string') {
            return res.status(400).json({ message: "ChildId and PickUpStationId are required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations: {
                stationActivitySessions: true,
                activityTransfer: true
            }
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

        let isNormalDeadlineOver = false
        if(activitySession.inLateRegistration){
            if(activitySession.startedAt){
                return res.status(404).json({ message: "Cannot register on an ongoing or past activity" });
            }
            else{
                isNormalDeadlineOver = true
            }
        }

        // Activity session doesn't support transfer
        if (!activitySession.activityTransferId || activitySession.stationActivitySessions.find(sas => sas.stationId === child.dropOffStationId)) {
            const pickUpStationNumber = activitySession.stationActivitySessions.find(sas => sas.stationId === pickUpStationId)?.stopNumber;
            const dropOffStationNumber = activitySession.stationActivitySessions.find(sas => sas.stationId === child.dropOffStationId)?.stopNumber;

            if (pickUpStationNumber && dropOffStationNumber && pickUpStationNumber >= dropOffStationNumber){
                return res.status(400).json({ message: "Cannot pick up child after or at drop-off station" });
            }

            await AppDataSource.getRepository(ChildActivitySession).insert({
                childId: childId,
                activitySessionId: activitySessionId,
                pickUpStationId: pickUpStationId,
                dropOffStationId: child.dropOffStationId,
                isLateRegistration: isNormalDeadlineOver,
                parentId: req.user?.userId
            });

            return res.status(201).json({ message: "Child added to activity session successfully" });
        }

        // Activity session supports transfer
        let currentSession = activitySession;
        let pickUp = pickUpStationId;
        const registrations: Partial<ChildActivitySession>[] = [];

        while (currentSession) {
            // If there is a transfer, determine the drop-off as the connecting station
            if (currentSession.activityTransferId) {
                const routeConnector = await AppDataSource.getRepository(RouteConnection).findOne({
                    where: {    
                        fromRouteId: currentSession.routeId,
                        toRouteId: currentSession.activityTransfer!.routeId
                    }
                });
                if (!routeConnector) {
                    return res.status(400).json({ message: `Route connection not found from ${currentSession.routeId} to ${currentSession.activityTransfer!.routeId}` });
                }

                // Add registration for current session (pickUp -> connector station)
                registrations.push({
                    childId: childId,
                    activitySessionId: currentSession.id,
                    pickUpStationId: pickUp,
                    dropOffStationId: routeConnector.stationId,
                    isLateRegistration: isNormalDeadlineOver,
                    parentId: req.user!.userId,
                    registeredAt: new Date(),
                    chainedActivitySessionId: activitySessionId
                });

                // Next session in the chain
                pickUp = routeConnector.stationId;
                const nextSession = await AppDataSource.getRepository(ActivitySession).findOne({
                    where: { 
                        id: currentSession.activityTransferId 
                    },
                    relations: {
                        stationActivitySessions: true,
                        activityTransfer: true
                    }
                });
                if (!nextSession) {
                    return res.status(404).json({ message: `Next activity session not found: ${currentSession.activityTransferId}` });
                }

                currentSession = nextSession;
            } else {
                registrations.push({
                    childId: childId,
                    activitySessionId: currentSession.id,
                    pickUpStationId: pickUp,
                    dropOffStationId: child.dropOffStationId,
                    isLateRegistration: isNormalDeadlineOver,
                    parentId: req.user!.userId,
                    registeredAt: new Date(),
                    chainedActivitySessionId: activitySessionId
                });
                break;
            }
        }

        await AppDataSource.getRepository(ChildActivitySession).insert(registrations);
        return res.status(201).json({ message: "Child added to activity session successfully" });


    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.delete('/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { childId } = req.body;

        if (!childId) {
            return res.status(400).json({ message: "Child ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations: {
                stationActivitySessions: true,
                activityTransfer: true
            }
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

        // If activity session supports transfer, check if it's possible to remove from all chained sessions (only if it's the first)
        if(existingRegistration.chainedActivitySessionId && existingRegistration.chainedActivitySessionId !== activitySessionId){
            return res.status(400).json({ message: "Child can only be removed from the first activity session in a transfer chain" });
        }

        // If activity session supports transfer, remove from all chained sessions
        if (activitySession.activityTransferId && activitySession.stationActivitySessions.find(sas => sas.stationId !== child.dropOffStationId)) {
            let currentSession = activitySession;
            const sessionIdsToDelete: string[] = [];

            while (currentSession) {
                sessionIdsToDelete.push(currentSession.id);

                if (currentSession.activityTransferId) {
                    const nextSession = await AppDataSource.getRepository(ActivitySession).findOne({
                        where: { id: currentSession.activityTransferId },
                        relations: {
                            stationActivitySessions: true,
                            activityTransfer: true
                        }
                    });
                    if (!nextSession) {
                        break;
                    }
                    currentSession = nextSession;
                } else {
                    break;
                }
            }

            await AppDataSource.getRepository(ChildActivitySession).delete({
                childId: childId,
                activitySessionId: In(sessionIdsToDelete)
            });

            return res.status(200).json({ message: "Child removed from activity session successfully" });
        }

        // If no transfer, just remove from this session
        await AppDataSource.getRepository(ChildActivitySession).delete({
            childId: childId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Child removed from activity session successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;