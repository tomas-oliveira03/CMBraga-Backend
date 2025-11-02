import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";

const router = express.Router();


// Get all stations from an activity
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const activityId = req.params.id;
        
        const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activityId
            },
            relations: {
                stationActivitySessions: {
                    station: true
                }
            },
            select: {
                stationActivitySessions: {
                    stopNumber: true,
                    scheduledAt: true,
                    arrivedAt: true,
                    leftAt: true,
                    station: true
                }
            }
        });

        if (!activityInfo){
            return res.status(404).json({ message: "Activity not found" })
        }

        // Sort by stop number
        const sortedStations = activityInfo.stationActivitySessions.sort((a, b) => a.stopNumber - b.stopNumber);

        return res.status(200).json(sortedStations);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;