import { AppDataSource } from "@/db";
import { Route } from "@/db/entities/Route";
import express, { Request, Response } from "express";
import { CreateRouteSchema, InitialUpdateSchema, UpdateRouteSchema } from "../schemas/route";
import z from "zod";
import { processKMLFromURL } from "../services/kmlParser";
import { Station } from "@/db/entities/Station";
import { ActivityMode, ActivityType, StationType, UserRole } from "@/helpers/types";
import { RouteStation } from "@/db/entities/RouteStation";
import multer from 'multer';
import { deleteFile, uploadFileBuffer } from "../services/cloud";
import { MAX_KML_SIZE } from "@/helpers/storage";
import { calculateTimeUntilArrival } from "../services/activity";
import { RouteConnection } from "@/db/entities/RouteConnection";
import { In, Not } from "typeorm";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const allRoutes = await AppDataSource.getRepository(Route).find({
            relations: {
                routeStations: true
            },
            select: {
                id: true,
                name: true,
                activityType: true,
                distanceMeters: true,
                createdAt: true
            }
        });
        
        const routesWithStationCount = allRoutes.map(route => ({
            id: route.id,
            name: route.name,
            activityType: route.activityType,
            distanceMeters: route.distanceMeters,
            createdAt: route.createdAt,
            numberOfStations: route.routeStations.length
        }));
        
        return res.status(200).json(routesWithStationCount);

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const routeId = req.params.id;

        const route = await AppDataSource.getRepository(Route).findOne({
            where: {
                id: routeId
            },
            relations: {
                routeStations: {
                    station: true
                },
                fromRouteConnections: {
                    toRoute: {
                        routeStations: {
                            station: true
                        }
                    },
                    station: true
                }
            }
        });
        if (!route){
            return res.status(404).json({ message: "Route not found" })
        }

        const bounds = {
            north: route.boundsNorth,
            east: route.boundsEast,
            south: route.boundsSouth,
            west: route.boundsWest
        };

        const stops = route.routeStations
            .map(rs => ({
                stationId: rs.stationId,
                stopNumber: rs.stopNumber,
                distanceFromStartMeters: rs.distanceFromStartMeters,
                timeFromStartMinutes: rs.timeFromStartMinutes,
                distanceFromPreviousStationMeters: rs.distanceFromPreviousStationMeters,
                name: rs.station.name,
                type: rs.station.type,
                latitude: rs.station.latitude,
                longitude: rs.station.longitude,
            }))
            .sort((a, b) => a.stopNumber - b.stopNumber);

        let response = {
            id: route.id,
            name: route.name,
            activityType: route.activityType,
            distanceMeters: route.distanceMeters,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
            route: route.metadata,
            bounds: bounds,
            stops: stops,
            connector: undefined as any
        };

        // Add route connector logic if available
        if(route.fromRouteConnections && route.fromRouteConnections[0]){
            const firstConnectorRoute = route.fromRouteConnections[0]
            const connectorStops = firstConnectorRoute.toRoute.routeStations
                .map(rs => ({
                    stationId: rs.stationId,
                    stopNumber: rs.stopNumber,
                    distanceFromStartMeters: rs.distanceFromStartMeters,
                    timeFromStartMinutes: rs.timeFromStartMinutes,
                    distanceFromPreviousStationMeters: rs.distanceFromPreviousStationMeters,
                    name: rs.station.name,
                    type: rs.station.type,
                    latitude: rs.station.latitude,
                    longitude: rs.station.longitude,
                }))
                .sort((a, b) => a.stopNumber - b.stopNumber)
                .filter((rs, i, arr) => {
                    const startIndex = arr.findIndex(s => s.stationId === firstConnectorRoute.station.id);
                    return i > startIndex; 
                });

            response.connector = {
                connectorStation: {
                    id: firstConnectorRoute.station.id,
                    name: firstConnectorRoute.station.name
                },
                connectorRoute: {
                    id: firstConnectorRoute.toRoute.id,
                    name: firstConnectorRoute.toRoute.name,
                    activityType: firstConnectorRoute.toRoute.activityType,
                    distanceMeters: firstConnectorRoute.toRoute.distanceMeters,
                    createdAt: firstConnectorRoute.toRoute.createdAt,
                    updatedAt: firstConnectorRoute.toRoute.updatedAt,
                    route: firstConnectorRoute.toRoute.metadata,
                    stops: connectorStops,
                }
            }
        }

        return res.status(200).json(response);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/', authenticate, authorize(UserRole.ADMIN), upload.single('file'), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateRouteSchema.parse(req.body);
        
        if (!req.file) {
            return res.status(400).json({ message: "KML file is required" });
        }
        if (req.file.mimetype !== 'application/vnd.google-earth.kml+xml') {
            return res.status(400).json({ message: "File must be a KML file" });
        }

        if (req.file.size > MAX_KML_SIZE) {
            return res.status(400).json({ message: "File size exceeds 1MB limit" });
        }

        const route = await AppDataSource.getRepository(Route).findOne({
            where: { name: validatedData.name }
        });

        if (route) {
            return res.status(404).json({ message: "Route name already exists" });
        }

        // Upload buffer directly to cloud
        const cloudStoredFileURL = await uploadFileBuffer(
            req.file.buffer, 
            validatedData.name.replace(/\s+/g, '-')
        );

        // Process KML from cloud URL
        const routeData = await processKMLFromURL(cloudStoredFileURL);

        // Delete file from cloud
        await deleteFile(cloudStoredFileURL)

        let stationsList: Array<{
            id: string,
            name: string,
            stopNumber: number,
            typeofStation: StationType,
            expectedTimeOfArrivalFromStartMinutes: number
        }> = [];

        let routeId: string = '';

        await AppDataSource.transaction(async tx => {

            const route = await tx.getRepository(Route).insert({
                name: validatedData.name,
                activityType: validatedData.activityType,
                distanceMeters: routeData.totalDistance,
                boundsNorth: routeData.bounds.north,
                boundsEast: routeData.bounds.east,
                boundsSouth: routeData.bounds.south,
                boundsWest: routeData.bounds.west,
                metadata: routeData.route
            })
            routeId = route.identifiers[0]?.id
            
            let stopNumber = 0
            for (const stationData of routeData.stops){
                stopNumber++
                let stationId
                const stationExists = await tx.getRepository(Station).findOne({
                    where: {
                        latitude: stationData.lat,
                        longitude: stationData.lon
                    }
                })
                
                if(stationExists) {
                    stationId = stationExists.id
                }
                else {
                    const station = await tx.getRepository(Station).insert({
                        name: stationData.name,
                        type: StationType.SCHOOL,
                        latitude: stationData.lat,
                        longitude: stationData.lon
                    })
                    stationId = station.identifiers[0]?.id
                }
                
                const activityMode = validatedData.activityType === ActivityType.PEDIBUS ? ActivityMode.WALK : ActivityMode.BIKE;
                
                const timeFromStartMinutes = calculateTimeUntilArrival(stationData.distanceFromStart, activityMode);
                await tx.getRepository(RouteStation).insert({
                    routeId: routeId,
                    stationId: stationId,
                    stopNumber: stopNumber,
                    distanceFromStartMeters: stationData.distanceFromStart,
                    distanceFromPreviousStationMeters: stationData.distanceFromPrevious,
                    timeFromStartMinutes: timeFromStartMinutes
                })

                stationsList.push({
                    id: stationId,
                    name: stationData.name,
                    stopNumber: stopNumber,
                    typeofStation: stationExists?.type ?? StationType.SCHOOL,
                    expectedTimeOfArrivalFromStartMinutes: timeFromStartMinutes
                });
            }
        });

        const finalPayload = {
            id: routeId,
            stops: stationsList.sort((a, b) => a.stopNumber - b.stopNumber)
        };
        
        return res.status(201).json(finalPayload);

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


// Route call right after route insertion
router.put('/initial-update/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const routeId = req.params.id;
        const validatedData = InitialUpdateSchema.parse(req.body);

        const route = await AppDataSource.getRepository(Route).findOne({
            where: { id: routeId }
        });
        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }

        await AppDataSource.transaction(async tx => {

            for (const updateData of validatedData) {
                const station = await tx.getRepository(Station).findOne({
                    where: { id: updateData.stationId }
                });
                if (!station) {
                    throw new Error(`Station with ID ${updateData.stationId} not found`);
                }
                if (station.type===StationType.SCHOOL && updateData.type !== StationType.SCHOOL) {
                    throw new Error(`Station with ID ${updateData.stationId} is a school station and it cannot be updated to anything else`);
                }

                await tx.getRepository(Station).update(
                    { id: updateData.stationId },
                    { type: updateData.type });

                await tx.getRepository(RouteStation).update(
                    { 
                        routeId: route.id,
                        stationId: updateData.stationId
                    },
                    { timeFromStartMinutes: updateData.timeFromStartMinutes });
            }
        });

        return res.status(200).json({ message: "Route updated successfully" });

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


router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const routeId = req.params.id;
        const validatedData = UpdateRouteSchema.parse(req.body);

        const route = await AppDataSource.getRepository(Route).findOne({
            where: { id: routeId }
        });
        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }

        await AppDataSource.transaction(async tx => {
            const { routeConnector, ...updatedData} = validatedData
            await tx.getRepository(Route).update(route.id, {
                ...updatedData,
                updatedAt: new Date()
            });
            
            // Connector route logic
            if (validatedData.routeConnector){
                const connectorRouteExists = await tx.getRepository(Route).findOne({
                    where: { id: validatedData.routeConnector.routeId }
                });
                if (!connectorRouteExists) {
                    throw new Error("Connector route not found");
                }

                if(connectorRouteExists.activityType !== route.activityType){
                    throw new Error("Cannot connect to a different route type")
                }

                const connectorStationExists = await tx.getRepository(Station).findOne({
                    where: { id: validatedData.routeConnector.stationId }
                });
                if (!connectorStationExists) {
                    throw new Error("Connector station not found");
                }

                const connectorExists = await tx.getRepository(RouteConnection).findOne({
                    where: {
                        fromRouteId: route.id,
                        toRouteId: validatedData.routeConnector.routeId,
                    }
                });
                if(connectorExists){
                    throw new Error("This route already has a connector, cannot be changed");
                }

                await tx.getRepository(RouteConnection).insert({
                    fromRouteId: route.id,
                    toRouteId: validatedData.routeConnector.routeId,
                    stationId: validatedData.routeConnector.stationId
                });
            }
        })

        return res.status(200).json({ message: "Route updated successfully" });

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


// All possible transfers a route can handle
router.get('/possible-transfers/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const routeId = req.params.id!;
        const route = await AppDataSource.getRepository(Route).findOne({
            where: { id: routeId },
            relations: { routeStations: { station: true } }
        });
        if (!route){
            return res.status(404).json({ message: "Route not found" })
        }

        const allStations = route.routeStations.map(rs => rs.stationId);

        const allRoutesThatLink = await AppDataSource.getRepository(RouteStation).find({
            where: {
                routeId: Not(routeId),
                stationId: In(allStations)
            },
            relations: {
                route: true,
                station: true
            }
        });

        // Map: routeId -> { id, name, stop }
        const routeLinksMap: Record<string, { 
            id: string,
            name: string,
            stops: Array<{ id: string, name: string }> }> = {};

        for (const rs of allRoutesThatLink) {
            if (!routeLinksMap[rs.route.id]) {
                routeLinksMap[rs.route.id] = {
                    id: rs.route.id,
                    name: rs.route.name,
                    stops: []
                };
            }
            routeLinksMap[rs.route.id]!.stops.push({
                id: rs.station.id,
                name: rs.station.name
            });
        }
        const allRouteLinks = Object.values(routeLinksMap);

        return res.status(200).json(allRouteLinks);

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
