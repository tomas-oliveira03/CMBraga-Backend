import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { CreateActivitySessionSchema, UpdateActivitySessionSchema } from "../schemas/activitySession";
import { z } from "zod";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { ActivityMode, ActivityType } from "@/helpers/types";
import { Route } from "@/db/entities/Route";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { findLinkedActivities } from "../services/transfer";

const router = express.Router();


router.get('/', async (req: Request, res: Response) => {
    try {
        const allSessions = await AppDataSource.getRepository(ActivitySession).find({
            relations: {
                route: true
            }
        });

        const activityPayload = allSessions.map(session => ({
            id: session.id,
            type: session.type,
            mode: session.mode,
            inLateRegistration: session.inLateRegistration,
            route: {
                id: session.route.id,
                name: session.route.name
            },
            weatherTemperature: session.weatherTemperature,
            weatherType: session.weatherType,
            scheduledAt: session.scheduledAt,
            startedById: session.startedById,
            startedAt: session.startedAt,
            finishedById: session.finishedById,
            finishedAt: session.finishedAt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        }))


        return res.status(200).json(activityPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


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

    const { previousActivityId, nextActivityId } = await findLinkedActivities(route, validatedData);

    let activitySessionId: string = '';
    await AppDataSource.transaction(async tx => {

        const activityMode = validatedData.type === ActivityType.PEDIBUS ? ActivityMode.WALK : ActivityMode.BIKE;

        const activitySession = await tx.getRepository(ActivitySession).insert({
            ...validatedData,
            mode: activityMode,
            activityTransferId: nextActivityId // If exists forward link
        });
        activitySessionId = activitySession.identifiers[0]?.id;

        const stationsActivitySession = route.routeStations.map(station => ({
            stationId: station.stationId,
            activitySessionId: activitySessionId,
            stopNumber: station.stopNumber,
            scheduledAt: new Date(validatedData.scheduledAt.getTime() + station.timeFromStartMinutes * 60 * 1000)
        }));

        await tx.getRepository(StationActivitySession).insert(stationsActivitySession);

        if (previousActivityId) { // If exists backwards link
            await tx.getRepository(ActivitySession).update(previousActivityId, {
                activityTransferId: activitySessionId,
            });
        }
    });

    return res.status(201).json({ id: activitySessionId });

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
