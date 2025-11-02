import { AppDataSource } from "@/db";
import { Feedback } from "@/db/entities/Feedback";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Child } from "@/db/entities/Child";
import { Parent } from "@/db/entities/Parent";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ParentChild } from "@/db/entities/ParentChild";
import express, { Request, Response } from "express";
import { CreateFeedbackSchema } from "@/server/schemas/feedback";
import { z } from "zod";
import { ChildStation } from "@/db/entities/ChildStation";

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const feedbacks = await AppDataSource.getRepository(Feedback).find();
        return res.status(200).json(feedbacks);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', async (req: Request, res: Response) => {
    try {
        const feedbackId = req.params.id;

        const feedback = await AppDataSource.getRepository(Feedback).findOne({
            where: { id: feedbackId }
        });

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        return res.status(200).json(feedback);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Get all feedbacks for a given child
router.get('/child/:childId', async (req: Request, res: Response) => {
    try {
        const childId = req.params.childId;

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId },
            relations: {
                feedbacks: true
            }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        return res.status(200).json(child.feedbacks);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Get all feedbacks for a given activity session
router.get('/activity/:activitySessionId', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.activitySessionId;

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations:{
                feedbacks: true
            }
        });

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        return res.status(200).json(activitySession.feedbacks);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateFeedbackSchema.parse(req.body);

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: validatedData.activitySessionId }
        });

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: validatedData.childId }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: validatedData.parentId }
        });

        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        const parentChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: validatedData.parentId,
                childId: validatedData.childId
            }
        });

        if (!parentChild) {
            return res.status(403).json({ message: "Parent is not responsible for this child" });
        }

        const childActivitySession = await AppDataSource.getRepository(ChildActivitySession).findOne({
            where: {
                childId: validatedData.childId,
                activitySessionId: validatedData.activitySessionId
            }
        });

        if (!childActivitySession) {
            return res.status(403).json({ message: "Child is not registered in this activity session" });
        }

        const childParticipated = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: validatedData.childId,
                activitySessionId: validatedData.activitySessionId
            }
        });
        if (!childParticipated) {
            return res.status(403).json({ message: "Child did not participate in this activity session" });
        }
        
        const existingFeedback = await AppDataSource.getRepository(Feedback).findOne({
            where: {
                activitySessionId: validatedData.activitySessionId,
                childId: validatedData.childId
            }
        });

        if (existingFeedback) {
            return res.status(400).json({ message: "Feedback already exists for this activity session" });
        }

        await AppDataSource.getRepository(Feedback).insert(validatedData);

        return res.status(200).json({ message: "Feedback created successfully"});

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
