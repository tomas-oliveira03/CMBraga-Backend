import { AppDataSource } from "@/db";
import { Route } from "@/db/entities/Route";
import express, { Request, Response } from "express";
import { CreateRouteSchema, InitialUpdateSchema, UpdateRouteSchema } from "../schemas/route";
import z from "zod";
import { processKMLFromURL } from "../services/kmlParser";
import { Station } from "@/db/entities/Station";
import { ActivityMode, ActivityType, StationType } from "@/helpers/types";
import { RouteStation } from "@/db/entities/RouteStation";
import multer from 'multer';
import { deleteFile, uploadFileBuffer } from "../services/cloud";
import { MAX_KML_SIZE } from "@/helpers/storage";
import { calculateTimeUntilArrival } from "../services/activity";
import { RouteConnection } from "@/db/entities/RouteConnection";
import { In, Not } from "typeorm";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /route:
 *   get:
 *     summary: Get all routes
 *     description: Returns a list of all routes with their station count
 *     tags:
 *       - Route
 *     responses:
 *       200:
 *         description: List of routes
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
 *                   name:
 *                     type: string
 *                     example: "Rota Pedibus Centro"
 *                   activityType:
 *                     type: string
 *                     enum: [pedibus, ciclo_expresso]
 *                     example: "pedibus"
 *                   distanceMeters:
 *                     type: integer
 *                     example: 2500
 *                     description: "Total route distance in meters"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   numberOfStations:
 *                     type: integer
 *                     example: 5
 *                     description: "Number of stations in the route"
 */
router.get('/', async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /route/{id}:
 *   get:
 *     summary: Get route by ID
 *     description: Returns a single route by its ID with station info and bounds object
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     responses:
 *       200:
 *         description: Route found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 name:
 *                   type: string
 *                   example: "Rota Pedibus Centro"
 *                 activityType:
 *                   type: string
 *                   enum: [pedibus, ciclo_expresso]
 *                   example: "pedibus"
 *                 distanceMeters:
 *                   type: integer
 *                   example: 2500
 *                   description: "Total route distance in meters"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: null
 *                 route:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                         example: 41.553404
 *                       lon:
 *                         type: number
 *                         example: -8.397567
 *                   description: "Raw route metadata (array of lat/lon points)"
 *                 bounds:
 *                   type: object
 *                   properties:
 *                     north:
 *                       type: number
 *                       example: 41.554448
 *                     east:
 *                       type: number
 *                       example: -8.395174
 *                     south:
 *                       type: number
 *                       example: 41.542617
 *                     west:
 *                       type: number
 *                       example: -8.404334
 *                   description: "Bounding box of the route"
 *                 stops:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stationId:
 *                         type: string
 *                         example: "37b57f49-fecf-413d-bc90-6727682a8785"
 *                       stopNumber:
 *                         type: integer
 *                         example: 1
 *                       distanceFromStartMeters:
 *                         type: integer
 *                         example: 0
 *                       timeFromStartMinutes:
 *                         type: integer
 *                         example: 0
 *                       distanceFromPreviousStationMeters:
 *                         type: integer
 *                         example: 0
 *                       name:
 *                         type: string
 *                         example: "R. Manuel Ferreira Gomes"
 *                       type:
 *                         type: string
 *                         enum: [regular, school]
 *                         example: "regular"
 *                       latitude:
 *                         type: number
 *                         example: 41.553404
 *                       longitude:
 *                         type: number
 *                         example: -8.397567
 *                   description: "List of stops with station info flattened"
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const routeId = req.params.id;

        const route = await AppDataSource.getRepository(Route).findOne({
            where: {
                id: routeId
            },
            relations: {
                routeStations: {
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

        const response = {
            id: route.id,
            name: route.name,
            activityType: route.activityType,
            distanceMeters: route.distanceMeters,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
            route: route.metadata,
            bounds: bounds,
            stops: stops
        };

        return res.status(200).json(response);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /route:
 *   post:
 *     summary: Create a new route from KML file
 *     description: Creates a new route by processing a KML file (a.kml). Automatically creates stations and route-station relationships. The KML file should contain a LineString for the route path and Placemarks for stations. All distances are stored in meters (integers).
 *     tags:
 *       - Route
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - activityType
 *               - file
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Rota Pedibus Norte"
 *                 description: "Unique name for the route"
 *               activityType:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *                 description: "Type of activity for this route"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "KML file containing route and station data"
 *     responses:
 *       201:
 *         description: Route created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route created successfully"
 *       400:
 *         description: Validation error or missing/invalid file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "KML file is required"
 *       404:
 *         description: Route name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route name already exists"
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
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
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
            typeofStation: string,
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

/**
 * @swagger
 * /route/initial-update/{id}:
 *   put:
 *     summary: Initial update for route stations and times
 *     description: Updates station types and time from start for each station in a route. Should be called immediately after route creation to finalize station data.
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - stationId
 *                 - type
 *                 - timeFromStartMinutes
 *               properties:
 *                 stationId:
 *                   type: string
 *                   example: "37b57f49-fecf-413d-bc90-6727682a8785"
 *                 type:
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 timeFromStartMinutes:
 *                   type: integer
 *                   example: 5
 *     responses:
 *       200:
 *         description: Route updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
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
router.put('/initial-update/:id', async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /route/{id}:
 *   put:
 *     summary: Update route by ID
 *     description: Updates the route's information by its ID. Only name and activityType can be updated.
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Rota Pedibus Centro"
 *               activityType:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *     responses:
 *       200:
 *         description: Route updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
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
router.put('/:id', async (req: Request, res: Response) => {
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

                const connectorStationExists = await tx.getRepository(Station).findOne({
                    where: { id: validatedData.routeConnector.stationId }
                });
                if (!connectorStationExists) {
                    throw new Error("Connector station not found");
                }

                await tx.getRepository(RouteConnection).delete({
                    fromRouteId: route.id,
                    toRouteId: validatedData.routeConnector.routeId
                });

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

/**
 * @swagger
 * /route/possible-transfers/{id}:
 *   get:
 *     summary: Get all possible transfer routes and stops for a route
 *     description: Returns a list of all routes that share at least one station with the given route, and for each route, the list of shared stops (station id and name).
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     responses:
 *       200:
 *         description: List of possible transfer routes and stops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                   name:
 *                     type: string
 *                     example: "Rota Ciclo Expresso Norte"
 *                   stops:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "station-uuid-1"
 *                         name:
 *                           type: string
 *                           example: "Estação Central"
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
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
router.get('/possible-transfers/:id', async (req: Request, res: Response) => {
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
