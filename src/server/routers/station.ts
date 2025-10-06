import { AppDataSource } from "@/db";
import { Station } from "@/db/entities/Station";
import express, { Request, Response } from "express";
import { CreateStationSchema, UpdateStationSchema } from "../schemas/station";
import { z } from "zod";

const router = express.Router();

/**
 * @swagger
 * /station:
 *   get:
 *     summary: Get all stations
 *     description: Returns a list of all stations
 *     tags:
 *       - Station
 *     responses:
 *       200:
 *         description: List of stations
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
 *                     example: "Estação Central"
 *                   type:
 *                     type: string
 *                     enum: [regular, school]
 *                     example: "regular"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T14:45:30.000Z"
 */
router.get('/', async (req: Request, res: Response) => {
    const allStations = await AppDataSource.getRepository(Station).find();
    return res.status(200).json(allStations);
});

/**
 * @swagger
 * /station/{id}:
 *   get:
 *     summary: Get station by ID
 *     description: Returns a single station by its ID
 *     tags:
 *       - Station
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Station ID (UUID)
 *     responses:
 *       200:
 *         description: Station found
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
 *                   example: "Escola Básica de Braga"
 *                 type:
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "school"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
    const stationId = req.params.id;

    const station = await AppDataSource.getRepository(Station).findOne({
        where: { id: stationId }
    });

    if (!station){
        return res.status(404).json({ message: "Station not found" })
    }

    return res.status(200).json(station);
});

/**
 * @swagger
 * /station:
 *   post:
 *     summary: Create a new station
 *     description: Creates a new station (regular or school)
 *     tags:
 *       - Station
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Estação Praça da República"
 *               type:
 *                 type: string
 *                 enum: [regular, school]
 *                 example: "regular"
 *           example:
 *             name: "Escola Secundária Sá de Miranda"
 *             type: "school"
 *     responses:
 *       201:
 *         description: Station created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station created successfully"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateStationSchema.parse(req.body);

        await AppDataSource.getRepository(Station).insert(validatedData);
        
        return res.status(201).json({ message: "Station created successfully" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /station/{id}:
 *   put:
 *     summary: Update a station
 *     description: Updates an existing station
 *     tags:
 *       - Station
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Station ID (UUID)
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
 *                 example: "Estação Avenida Central"
 *               type:
 *                 type: string
 *                 enum: [regular, school]
 *                 example: "regular"
 *           example:
 *             name: "Escola Básica Palmeira"
 *     responses:
 *       200:
 *         description: Station updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Station not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const stationId = req.params.id;
        const validatedData = UpdateStationSchema.parse(req.body);
        
        const station = await AppDataSource.getRepository(Station).findOne({
            where: { id: stationId }
        });

        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }

        await AppDataSource.getRepository(Station).update(station.id, {
            ...validatedData,
            updatedAt: new Date()
        });
        
        return res.status(200).json({ message: "Station updated successfully" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /station/{id}:
 *   delete:
 *     summary: Delete a station
 *     description: Deletes a station by ID
 *     tags:
 *       - Station
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Station ID (UUID)
 *     responses:
 *       200:
 *         description: Station deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station deleted successfully"
 *       404:
 *         description: Station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station not found"
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
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const stationId = req.params.id;
        
        const station = await AppDataSource.getRepository(Station).findOne({
            where: { id: stationId }
        });

        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }

        await AppDataSource.getRepository(Station).delete(station.id);
        
        return res.status(200).json({ message: "Station deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
});

export default router;
