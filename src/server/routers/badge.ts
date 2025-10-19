import express, { Request, Response } from "express";
import { AppDataSource } from "@/db";
import { Badge } from "@/db/entities/Badge";
import { z } from "zod";
import { authorize } from "@/server/middleware/auth";
import { UserRole } from "@/helpers/types";
import { UpdateBadgeSchema, CreateBadgeSchema } from "../schemas/badge";

const router = express.Router();

// TODO: Only admin can create, update, delete badges

/**
 * @swagger
 * /badge:
 *   get:
 *     summary: Get all badges
 *     description: Returns a list of all badges
 *     tags:
 *       - Badge
 *     responses:
 *       200:
 *         description: List of badges
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const badges = await AppDataSource.getRepository(Badge).find();
        return res.status(200).json(badges);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge/{id}:
 *   get:
 *     summary: Get badge by ID
 *     description: Returns a single badge by its ID
 *     tags:
 *       - Badge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Badge found
 *       404:
 *         description: Badge not found
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const badge = await AppDataSource.getRepository(Badge).findOne({ where: { id: req.params.id } });
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        return res.status(200).json(badge);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge:
 *   post:
 *     summary: Create a new badge
 *     description: Creates a new badge
 *     tags:
 *       - Badge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               criteria:
 *                 type: string
 *                 enum: [streak, distance, calories, weather, points, special]
 *               value:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/images/badge.png"
 *     responses:
 *       201:
 *         description: Badge created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateBadgeSchema.parse(req.body);

        // Validate image URL
        if (validatedData.imageUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(validatedData.imageUrl)) {
            return res.status(400).json({ message: "Invalid image URL" });
        }

        // Check if a badge with the same name already exists
        const existingBadge = await AppDataSource.getRepository(Badge).findOne({ where: { name: validatedData.name } });
        if (existingBadge) {
            return res.status(400).json({ message: "Badge name must be unique" });
        }

        await AppDataSource.getRepository(Badge).insert(validatedData);
        return res.status(201).json({ message: "Badge created successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge/{id}:
 *   put:
 *     summary: Update a badge
 *     description: Updates an existing badge
 *     tags:
 *       - Badge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               criteria:
 *                 type: string
 *                 enum: [streak, distance, calories, weather, points, special]
 *               value:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/images/badge.png"
 *     responses:
 *       200:
 *         description: Badge updated successfully
 *       404:
 *         description: Badge not found
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = UpdateBadgeSchema.parse(req.body);

        const existingBadge = await AppDataSource.getRepository(Badge).findOne({ where: { name: validatedData.name } });
        const currentBadge = await AppDataSource.getRepository(Badge).findOne({ where: { id: req.params.id } });

        if (!currentBadge) {
            return res.status(404).json({ message: "Badge not found" });
        }

        if (existingBadge && existingBadge.id !== currentBadge.id) {
            return res.status(400).json({ message: "Badge name must be unique" });
        }

        await AppDataSource.getRepository(Badge).update(currentBadge.id, validatedData);
        return res.status(200).json({ message: "Badge updated successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /badge/{id}:
 *   delete:
 *     summary: Delete a badge
 *     description: Deletes a badge by ID
 *     tags:
 *       - Badge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Badge deleted successfully
 *       404:
 *         description: Badge not found
 */
router.delete('/:id', authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const badge = await AppDataSource.getRepository(Badge).findOne({ where: { id: req.params.id } });
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        await AppDataSource.getRepository(Badge).delete(badge.id);
        return res.status(200).json({ message: "Badge deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
