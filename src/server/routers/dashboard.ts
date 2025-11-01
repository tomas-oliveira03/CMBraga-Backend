import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";


const router = express.Router();


// Get issues informationn in given activity
router.get('/issue/activity/:id', async (req: Request, res : Response) => {
    try {
        const activityId = req.params.id;
        const activity = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activityId }, 
            relations: {
                issues: true
            },
            select: {
                id: true,
                type: true,
                scheduledAt: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
                updatedAt: true,
                issues:{
                    id: true,
                    description: true,
                    imageURLs: true,
                    createdAt: true,
                    updatedAt: true,
                    resolvedAt: true,
                    instructorId: true
                }
            }
        })
        
        if(!activity){
            return res.status(404).json({ message: "Activity not found" });
        }

        return res.status(200).json(activity)
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})


export default router;
