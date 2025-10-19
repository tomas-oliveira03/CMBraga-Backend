import { AppDataSource } from "@/db";
import { Station } from "@/db/entities/Station";
import express, { Request, Response } from "express";

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
    try {
        const allStations = await AppDataSource.getRepository(Station).find();
        return res.status(200).json(allStations);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
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
    try {
        const stationId = req.params.id;

        const station = await AppDataSource.getRepository(Station).findOne({
            where: { id: stationId }
        });

        if (!station){
            return res.status(404).json({ message: "Station not found" })
        }

        return res.status(200).json(station);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;
