"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
const Parent_1 = require("../../db/entities/Parent");
const express_1 = __importDefault(require("express"));
const parent_1 = require("../schemas/parent");
const zod_1 = require("zod");
const information_hash_1 = __importDefault(require("../../lib/information-hash"));
const router = express_1.default.Router();
/**
 * @swagger
 * /parent:
 *   get:
 *     summary: Get all parents
 *     description: Returns a list of all parents
 *     tags:
 *       - Parent
 *     responses:
 *       200:
 *         description: List of parents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *                   name:
 *                     type: string
 *                     example: "Maria Silva"
 *                   email:
 *                     type: string
 *                     example: "maria.silva@gmail.com"
 *                   phone:
 *                     type: string
 *                     example: "+351 912 345 678"
 *                   address:
 *                     type: string
 *                     example: "Rua das Flores, 123 - Braga"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T14:45:30.000Z"
 */
router.get('/', async (req, res) => {
    const allParents = await db_1.AppDataSource.getRepository(Parent_1.Parent).find();
    return res.status(200).json(allParents);
});
/**
 * @swagger
 * /parent/{id}:
 *   get:
 *     summary: Get parent by ID
 *     description: Returns a single parent by their ID
 *     tags:
 *       - Parent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *         description: Parent ID (UUID)
 *     responses:
 *       200:
 *         description: Parent found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *                 name:
 *                   type: string
 *                   example: "João Santos"
 *                 email:
 *                   type: string
 *                   example: "joao.santos@gmail.com"
 *                 phone:
 *                   type: string
 *                   example: "+351 967 890 123"
 *                 address:
 *                   type: string
 *                   example: "Avenida da Liberdade, 456 - Braga"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Parent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent not found"
 */
router.get('/:id', async (req, res) => {
    const parentId = req.params.id;
    const parent = await db_1.AppDataSource.getRepository(Parent_1.Parent).findOne({
        where: {
            id: parentId
        }
    });
    if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
    }
    return res.status(200).json(parent);
});
/**
 * @swagger
 * /parent/{id}:
 *   put:
 *     summary: Update a parent
 *     description: Updates an existing parent
 *     tags:
 *       - Parent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *         description: Parent ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@gmail.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Largo do Paço, 321 - Braga"
 *           example:
 *             name: "Sofia Mendes"
 *             email: "sofia.mendes@gmail.com"
 *             phone: "+351 945 678 901"
 *     responses:
 *       200:
 *         description: Parent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Parent not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
    try {
        const parentId = req.params.id;
        const validatedData = parent_1.UpdateParentSchema.parse(req.body);
        if (validatedData.password) {
            validatedData.password = information_hash_1.default.encrypt(validatedData.password);
        }
        const parent = await db_1.AppDataSource.getRepository(Parent_1.Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        await db_1.AppDataSource.getRepository(Parent_1.Parent).update(parent.id, {
            ...validatedData,
            updatedAt: new Date()
        });
        return res.status(200).json({ message: "Parent updated successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /parent/{id}:
 *   delete:
 *     summary: Delete a parent
 *     description: Deletes a parent by ID
 *     tags:
 *       - Parent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *         description: Parent ID (UUID)
 *     responses:
 *       200:
 *         description: Parent deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent deleted successfully"
 *       404:
 *         description: Parent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete('/:id', async (req, res) => {
    try {
        const parentId = req.params.id;
        const parent = await db_1.AppDataSource.getRepository(Parent_1.Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        await db_1.AppDataSource.getRepository(Parent_1.Parent).delete(parent.id);
        return res.status(200).json({ message: "Parent deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
