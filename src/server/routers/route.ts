import { AppDataSource } from "@/db";
import { Route } from "@/db/entities/Route";
import express, { Request, Response } from "express";
import { CreateRouteSchema } from "../schemas/route";
import z from "zod";
import { processKMZFromURL } from "../services/kmzParser";
import { Station } from "@/db/entities/Station";
import { StationType } from "@/helpers/types";
import { RouteStation } from "@/db/entities/RouteStation";
import multer from 'multer';
import { deleteFile, uploadFileBuffer } from "../services/cloud";

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
    const allRoutes = await AppDataSource.getRepository(Route).find({
        relations: {
            routeStations: true
        },
        select: {
            id: true,
            name: true,
            distanceMeters: true,
            createdAt: true
        }
    });
    
    const routesWithStationCount = allRoutes.map(route => ({
        id: route.id,
        name: route.name,
        distanceMeters: route.distanceMeters,
        createdAt: route.createdAt,
        numberOfStations: route.routeStations.length
    }));
    
    return res.status(200).json(routesWithStationCount);
});

/**
 * @swagger
 * /route/{id}:
 *   get:
 *     summary: Get route by ID
 *     description: Returns a single route by its ID with station count
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
 *                 distanceMeters:
 *                   type: integer
 *                   example: 2500
 *                   description: "Total route distance in meters"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 numberOfStations:
 *                   type: integer
 *                   example: 5
 *                   description: "Number of stations in the route"
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
    const routeId = req.params.id;

    const route = await AppDataSource.getRepository(Route).findOne({
        where: {
            id: routeId
        },
        relations: {
            routeStations: true
        },
        select: {
            id: true,
            name: true,
            distanceMeters: true,
            createdAt: true
        }
    });

    if (!route){
        return res.status(404).json({ message: "Route not found" })
    }

    const routeWithStationCount = {
        id: route.id,
        name: route.name,
        distanceMeters: route.distanceMeters,
        createdAt: route.createdAt,
        numberOfStations: route.routeStations.length
    };

    return res.status(200).json(routeWithStationCount);
});

/**
 * @swagger
 * /route:
 *   post:
 *     summary: Create a new route from KMZ file
 *     description: Creates a new route by processing a KMZ file (a.kmz). Automatically creates stations and route-station relationships. The KMZ file should contain a LineString for the route path and Placemarks for stations. All distances are stored in meters (integers).
 *     tags:
 *       - Route
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Rota Pedibus Norte"
 *                 description: "Unique name for the route"
 *           example:
 *             name: "Rota Pedibus Sul"
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
        // Check if .kmz file was sent
        if (!req.file) {
            return res.status(400).json({ message: "KMZ file is required" });
        }

        if (req.file.mimetype !== 'application/vnd.google-earth.kmz') {
            return res.status(400).json({ message: "File must be a KMZ file" });
        }

        const validatedData = CreateRouteSchema.parse(req.body);

        const route = await AppDataSource.getRepository(Route).findOne({
            where: { name: validatedData.name }
        });

        if (route) {
            return res.status(404).json({ message: "Route name already exists" });
        }

        // Upload buffer directly to cloud
        const cloudinaryUrl = await uploadFileBuffer(
            req.file.buffer, 
            validatedData.name.replace(/\s+/g, '-')
        );

        // Process KMZ from cloud URL
        const routeData = await processKMZFromURL(cloudinaryUrl);

        // Delete file from cloud
        await deleteFile(cloudinaryUrl)

        await AppDataSource.transaction(async tx => {

            const route = await tx.getRepository(Route).insert({
                name: validatedData.name,
                distanceMeters: routeData.totalDistance,
                boundsNorth: routeData.bounds.north,
                boundsEast: routeData.bounds.east,
                boundsSouth: routeData.bounds.south,
                boundsWest: routeData.bounds.west,
                metadata: routeData.route
            })
            const routeId = route.identifiers[0]?.id
            
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
                
                await tx.getRepository(RouteStation).insert({
                    routeId: routeId,
                    stationId: stationId,
                    stopNumber: stopNumber,
                    distanceFromStartMeters: stationData.distanceFromStart,
                    distanceFromPreviousStationMeters: stationData.distanceFromPrevious
                })
            }
        });
        
        return res.status(201).json({ message: "Route created successfully" });

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

export default router;
