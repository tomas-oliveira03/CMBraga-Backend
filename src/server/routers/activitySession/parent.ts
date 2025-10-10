import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { UserRole } from "@/helpers/types";
import { Parent } from "@/db/entities/Parent";
import { ParentActivitySession } from "@/db/entities/ParentActivitySession";
import { authenticate, authorize } from "@/server/middleware/auth";

const router = express.Router();



router.get('/', async (req: Request, res: Response) => {
    const activityId = req.query.id;

    if (!activityId || typeof activityId !== 'string') {
        return res.status(400).json({ message: "Activity ID is required" });
    }
    
    const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            parentActivitySessions: {
                parent: true
            }
        },
        select: {
            parentActivitySessions: {
                assignedAt: true,
                parent: {
                    id: true,
                    name: true
                }
            }
        }
    });

    if (!activityInfo){
        return res.status(404).json({ message: "Activity not found" })
    }

    return res.status(200).json(activityInfo?.parentActivitySessions);
});


router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.activitySessionId;
        const parentId = req.query.parentId;
        
        if (!activitySessionId || !parentId || typeof activitySessionId !== 'string' || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID and Parent ID are required" });
        }

        if (!parentId || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Parent ID is required" });
        }   
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        // Assign parent to activity session
        await AppDataSource.getRepository(ParentActivitySession).insert({
                parentId: parentId,
                activitySessionId: activitySessionId
        });


        return res.status(201).json({ message: "Parent assigned to activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.delete('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.activitySessionId;
        const parentId  = req.query.parentId;

        if (!activitySessionId || !parentId || typeof activitySessionId !== 'string' || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID and Parent ID are required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        // Check if parent is assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(ParentActivitySession).findOne({
            where: {
                parentId: parentId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Parent is not assigned to this activity session" });
        }

        // Remove parent from activity session
        await AppDataSource.getRepository(ParentActivitySession).delete({
                parentId: parentId,
                activitySessionId: activitySessionId
        });

        // Remove parent from activity session
        await AppDataSource.getRepository(ParentActivitySession).delete({
            parentId: parentId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Parent removed from activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


export default router;