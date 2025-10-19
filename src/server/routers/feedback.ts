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

const router = express.Router();

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get all feedbacks
 *     description: Returns a list of all feedbacks with related activity session, child, and parent information
 *     tags:
 *       - Feedback
 *     responses:
 *       200:
 *         description: List of all feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "f1e2d3c4-b5a6-7890-1234-567890abcdef"
 *                   evaluation1:
 *                     type: integer
 *                     example: 5
 *                   evaluation2:
 *                     type: integer
 *                     example: 4
 *                   evaluation3:
 *                     type: integer
 *                     example: 5
 *                   evaluation4:
 *                     type: integer
 *                     example: 3
 *                   evaluation5:
 *                     type: integer
 *                     example: 4
 *                   textFeedback:
 *                     type: string
 *                     example: "A atividade foi muito divertida e educativa!"
 *                   overallRating:
 *                     type: integer
 *                     example: 4
 *                   submitedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-04-02T10:30:00.000Z"
 *                   activitySession:
 *                     type: object
 *                   child:
 *                     type: object
 *                   parent:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const feedbacks = await AppDataSource.getRepository(Feedback).find();
        return res.status(200).json(feedbacks);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /feedback/{id}:
 *   get:
 *     summary: Get feedback by ID
 *     description: Returns a single feedback by its ID with related information
 *     tags:
 *       - Feedback
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "f1e2d3c4-b5a6-7890-1234-567890abcdef"
 *         description: Feedback ID (UUID)
 *     responses:
 *       200:
 *         description: Feedback found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "f1e2d3c4-b5a6-7890-1234-567890abcdef"
 *                 evaluation1:
 *                   type: integer
 *                   example: 5
 *                 evaluation2:
 *                   type: integer
 *                   example: 4
 *                 evaluation3:
 *                   type: integer
 *                   example: 5
 *                 evaluation4:
 *                   type: integer
 *                   example: 3
 *                 evaluation5:
 *                   type: integer
 *                   example: 4
 *                 textFeedback:
 *                   type: string
 *                   example: "A atividade foi muito divertida e educativa!"
 *                 overallRating:
 *                   type: integer
 *                   example: 4
 *                 submitedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-04-02T10:30:00.000Z"
 *                 activitySession:
 *                   type: object
 *                 child:
 *                   type: object
 *                 parent:
 *                   type: object
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /feedback/child/{childId}:
 *   get:
 *     summary: Get all feedbacks for a specific child
 *     description: Returns all feedbacks submitted for a specific child
 *     tags:
 *       - Feedback
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *           example: "c1h2i3l4-d5e6-7890-1234-567890abcdef"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of feedbacks for the child
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   evaluation1:
 *                     type: integer
 *                   evaluation2:
 *                     type: integer
 *                   evaluation3:
 *                     type: integer
 *                   evaluation4:
 *                     type: integer
 *                   evaluation5:
 *                     type: integer
 *                   textFeedback:
 *                     type: string
 *                   overallRating:
 *                     type: integer
 *                   submitedAt:
 *                     type: string
 *                     format: date-time
 *                   activitySession:
 *                     type: object
 *                   parent:
 *                     type: object
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /feedback/activity/{activitySessionId}:
 *   get:
 *     summary: Get all feedbacks for a specific activity session
 *     description: Returns all feedbacks submitted for a specific activity session
 *     tags:
 *       - Feedback
 *     parameters:
 *       - in: path
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1c2t3i4-v5i6-7890-1234-567890abcdef"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of feedbacks for the activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   evaluation1:
 *                     type: integer
 *                   evaluation2:
 *                     type: integer
 *                   evaluation3:
 *                     type: integer
 *                   evaluation4:
 *                     type: integer
 *                   evaluation5:
 *                     type: integer
 *                   textFeedback:
 *                     type: string
 *                   overallRating:
 *                     type: integer
 *                   submitedAt:
 *                     type: string
 *                     format: date-time
 *                   child:
 *                     type: object
 *                   parent:
 *                     type: object
 *       404:
 *         description: Activity session not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Create a new feedback
 *     description: Creates a new feedback for an activity session with validations
 *     tags:
 *       - Feedback
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - evaluation1
 *               - evaluation2
 *               - evaluation3
 *               - evaluation4
 *               - evaluation5
 *               - textFeedback
 *               - overallRating
 *               - activitySessionId
 *               - childId
 *               - parentId
 *             properties:
 *               evaluation1:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: "Avaliação 1 (1-5)"
 *               evaluation2:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: "Avaliação 2 (1-5)"
 *               evaluation3:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: "Avaliação 3 (1-5)"
 *               evaluation4:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *                 description: "Avaliação 4 (1-5)"
 *               evaluation5:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: "Avaliação 5 (1-5)"
 *               textFeedback:
 *                 type: string
 *                 minLength: 1
 *                 example: "A atividade foi excelente! As crianças adoraram o percurso."
 *                 description: "Comentário em texto livre"
 *               overallRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: "Avaliação geral (1-5)"
 *               activitySessionId:
 *                 type: string
 *                 format: uuid
 *                 example: "a1c2t3i4-v5i6-7890-1234-567890abcdef"
 *                 description: "ID da sessão de atividade"
 *               childId:
 *                 type: string
 *                 format: uuid
 *                 example: "c1h2i3l4-d5e6-7890-1234-567890abcdef"
 *                 description: "ID da criança"
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 example: "p1a2r3e4-n5t6-7890-1234-567890abcdef"
 *                 description: "ID do pai/mãe"
 *           example:
 *             evaluation1: 5
 *             evaluation2: 4
 *             evaluation3: 5
 *             evaluation4: 3
 *             evaluation5: 4
 *             textFeedback: "Ótima experiência! Recomendo."
 *             overallRating: 4
 *             activitySessionId: "a1c2t3i4-v5i6-7890-1234-567890abcdef"
 *             childId: "c1h2i3l4-d5e6-7890-1234-567890abcdef"
 *             parentId: "p1a2r3e4-n5t6-7890-1234-567890abcdef"
 *     responses:
 *       201:
 *         description: Feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedback created successfully"
 *                 feedbackId:
 *                   type: string
 *                   example: "f1e2d3c4-b5a6-7890-1234-567890abcdef"
 *       400:
 *         description: Validation error or feedback already exists
 *       404:
 *         description: Activity session, child, or parent not found
 *       403:
 *         description: Parent is not responsible for the child or child not registered in activity
 *       500:
 *         description: Internal server error
 */
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

        const existingFeedback = await AppDataSource.getRepository(Feedback).findOne({
            where: {
                activitySessionId: validatedData.activitySessionId,
                childId: validatedData.childId,
                parentId: validatedData.parentId
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
