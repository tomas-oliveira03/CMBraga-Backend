"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../../db");
const Badge_1 = require("../../db/entities/Badge");
const zod_1 = require("zod");
const auth_1 = require("../../server/middleware/auth");
const types_1 = require("../../helpers/types");
const badge_1 = require("../schemas/badge");
const router = express_1.default.Router();
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
router.get('/', async (req, res) => {
    const badges = await db_1.AppDataSource.getRepository(Badge_1.Badge).find();
    return res.status(200).json(badges);
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
router.get('/:id', async (req, res) => {
    const badge = await db_1.AppDataSource.getRepository(Badge_1.Badge).findOne({ where: { id: req.params.id } });
    if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
    }
    return res.status(200).json(badge);
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
router.post('/', async (req, res) => {
    try {
        const validatedData = badge_1.CreateBadgeSchema.parse(req.body);
        // Validate image URL
        if (validatedData.imageUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(validatedData.imageUrl)) {
            return res.status(400).json({ message: "Invalid image URL" });
        }
        // Check if a badge with the same name already exists
        const existingBadge = await db_1.AppDataSource.getRepository(Badge_1.Badge).findOne({ where: { name: validatedData.name } });
        if (existingBadge) {
            return res.status(400).json({ message: "Badge name must be unique" });
        }
        const badge = db_1.AppDataSource.getRepository(Badge_1.Badge).create(validatedData);
        await db_1.AppDataSource.getRepository(Badge_1.Badge).save(badge);
        return res.status(201).json({ message: "Badge created successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: "Internal server error" + error });
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
router.put('/:id', async (req, res) => {
    try {
        const validatedData = badge_1.UpdateBadgeSchema.parse(req.body);
        const existingBadge = await db_1.AppDataSource.getRepository(Badge_1.Badge).findOne({ where: { name: validatedData.name } });
        const currentBadge = await db_1.AppDataSource.getRepository(Badge_1.Badge).findOne({ where: { id: req.params.id } });
        if (!currentBadge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        if (existingBadge && existingBadge.id !== currentBadge.id) {
            return res.status(400).json({ message: "Badge name must be unique" });
        }
        await db_1.AppDataSource.getRepository(Badge_1.Badge).update(currentBadge.id, validatedData);
        return res.status(200).json({ message: "Badge updated successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: "Internal server error" });
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
router.delete('/:id', (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    const badge = await db_1.AppDataSource.getRepository(Badge_1.Badge).findOne({ where: { id: req.params.id } });
    if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
    }
    await db_1.AppDataSource.getRepository(Badge_1.Badge).delete(badge.id);
    return res.status(200).json({ message: "Badge deleted successfully" });
});
exports.default = router;
