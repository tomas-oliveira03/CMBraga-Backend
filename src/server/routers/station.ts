import { AppDataSource } from "@/db";
import { Station } from "@/db/entities/Station";
import express, { Request, Response } from "express";

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const allStations = await AppDataSource.getRepository(Station).find();
        return res.status(200).json(allStations);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


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
