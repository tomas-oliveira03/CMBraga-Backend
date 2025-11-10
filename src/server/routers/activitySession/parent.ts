import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { UserRole } from "@/helpers/types";
import { Parent } from "@/db/entities/Parent";
import { ParentActivitySession } from "@/db/entities/ParentActivitySession";
import { authenticate, authorize } from "@/server/middleware/auth";

const router = express.Router();

router.get('/', authenticate, authorize(UserRole.INSTRUCTOR, UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
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
                    registeredAt: true,
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
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.activitySessionId;
        
        if (!activitySessionId || typeof activitySessionId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID is required" });
        }
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if(activitySession.startedAt){
            return res.status(404).json({ message: "Cannot add parent from an ongoing or past activity" });
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: req.user!.userId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        if(activitySession.startedAt){
            return res.status(404).json({ message: "Cannot register on an ongoing or past activity" });
        }

        // Check if parent is assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(ParentActivitySession).findOne({
            where: {
                parentId: req.user!.userId,
                activitySessionId: activitySessionId
            }
        });
        if (existingAssignment) {
            return res.status(400).json({ message: "Parent is already assigned to this activity session" });
        }

        await AppDataSource.getRepository(ParentActivitySession).insert({
            parentId: req.user!.userId,
            activitySessionId: activitySessionId
        });

        return res.status(201).json({ message: "Parent assigned to activity session successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.delete('/', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.activitySessionId;

        if (!activitySessionId || typeof activitySessionId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if(activitySession.startedAt){
            return res.status(404).json({ message: "Cannot remove parent from an ongoing or past activity" });
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: req.user!.userId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        // Check if parent is assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(ParentActivitySession).findOne({
            where: {
                parentId: req.user!.userId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Parent is not assigned to this activity session" });
        }

        // Remove parent from activity session
        await AppDataSource.getRepository(ParentActivitySession).delete({
                parentId: req.user!.userId,
                activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Parent removed from activity session successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;