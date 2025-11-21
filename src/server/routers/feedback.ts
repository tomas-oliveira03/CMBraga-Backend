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
import { ChildStationType, UserRole } from "@/helpers/types";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const feedbacks = await AppDataSource.getRepository(Feedback).find();
        return res.status(200).json(feedbacks);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
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


// Get all to-do feedbacks for a given child
router.get('/child/to-do/:childId', authenticate, authorize(UserRole.ADMIN, UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.childId;

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId },
            relations: {
                feedbacks: true,
                parentChildren: true,
                childStations: {
                    activitySession: {
                        route: true
                    },
                },
            }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }
        if (req.user!.role === UserRole.PARENT && !child.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Parent is not responsible for this child" });
        }

        const toDoFeedbacks = child.childStations
            .filter(cs => cs.type === ChildStationType.OUT)
            .filter(cs => !child.feedbacks.some(fb => fb.activitySessionId === cs.activitySessionId))
            .map(cs => cs.activitySession);

        const finalPayload = toDoFeedbacks.map(as => ({
            activitySessionId: as.id,
            routeName: as.route.name,
            scheduledAt: as.scheduledAt,
        }));

        return res.status(200).json(finalPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Get all feedbacks for a given child
router.get('/child/:childId', authenticate, authorize(UserRole.ADMIN, UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.childId;

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId },
            relations: {
                feedbacks: true,
                parentChildren: true
            }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }
        if (req.user!.role === UserRole.PARENT && !child.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Parent is not responsible for this child" });
        }

        return res.status(200).json(child.feedbacks);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Get all feedbacks for a given activity session
router.get('/activity/:activitySessionId', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
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


router.post('/', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateFeedbackSchema.parse(req.body);
        const parentId = req.user!.userId;

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
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        const parentChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: parentId,
                childId: validatedData.childId
            }
        });
        if (!parentChild) {
            return res.status(403).json({ message: "Parent is not responsible for this child" });
        }

        const childParticipated = await AppDataSource.getRepository(ChildStation).findOne({
            where: {
                childId: validatedData.childId,
                activitySessionId: validatedData.activitySessionId,
                type: ChildStationType.OUT
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

        await AppDataSource.getRepository(Feedback).insert({
            evaluation1: validatedData.evaluation1,
            evaluation2: validatedData.evaluation2,
            evaluation3: validatedData.evaluation3,
            evaluation4: validatedData.evaluation4,
            evaluation5: validatedData.evaluation5,
            textFeedback: validatedData.textFeedback,
            overallRating: validatedData.overallRating,
            activitySessionId: validatedData.activitySessionId,
            childId: validatedData.childId,
            parentId: parentId
        });

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
