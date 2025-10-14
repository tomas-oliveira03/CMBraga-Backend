"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
const Instructor_1 = require("../../db/entities/Instructor");
const express_1 = __importDefault(require("express"));
const instructor_1 = require("../../server/schemas/instructor");
const information_hash_1 = __importDefault(require("../../lib/information-hash"));
const zod_1 = __importDefault(require("zod"));
const router = express_1.default.Router();
/**
 * @swagger
 * /instructor:
 *   get:
 *     summary: Get all instructors
 *     description: Returns a list of all instructors
 *     tags:
 *       - Instructor
 *     responses:
 *       200:
 *         description: List of instructors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   name:
 *                     type: string
 *                     example: "Maria Silva"
 *                   email:
 *                     type: string
 *                     example: "maria.silva@cmbraga.pt"
 *                   phone:
 *                     type: string
 *                     example: "+351 912 345 678"
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
    const allInstructors = await db_1.AppDataSource.getRepository(Instructor_1.Instructor).find();
    return res.status(200).json(allInstructors);
});
/**
 * @swagger
 * /instructor/{id}:
 *   get:
 *     summary: Get instructor by ID
 *     description: Returns a single instructor by their ID
 *     tags:
 *       - Instructor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Instructor ID (UUID)
 *     responses:
 *       200:
 *         description: Instructor found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 name:
 *                   type: string
 *                   example: "João Santos"
 *                 email:
 *                   type: string
 *                   example: "joao.santos@cmbraga.pt"
 *                 phone:
 *                   type: string
 *                   example: "+351 925 678 901"
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
 *         description: Instructor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor not found"
 */
router.get('/:id', async (req, res) => {
    const instructorId = req.params.id;
    const instructor = await db_1.AppDataSource.getRepository(Instructor_1.Instructor).findOne({
        where: {
            id: instructorId
        }
    });
    if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
    }
    return res.status(200).json(instructor);
});
/**
 * @swagger
 * /instructor/{id}:
 *   put:
 *     summary: Update an instructor
 *     description: Updates an existing instructor
 *     tags:
 *       - Instructor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Instructor ID (UUID)
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
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               phone:
 *                 type: string
 *                 example: "+351 937 890 123"
 *           example:
 *             name: "Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *             phone: "+351 968 123 456"
 *     responses:
 *       200:
 *         description: Instructor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Instructor not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
    try {
        const instructorId = req.params.id;
        const validatedData = instructor_1.UpdateInstructorSchema.parse(req.body);
        if (validatedData.password) {
            validatedData.password = information_hash_1.default.encrypt(validatedData.password);
        }
        const instructor = await db_1.AppDataSource.getRepository(Instructor_1.Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        // Update intructor with updatedAt timestamp
        await db_1.AppDataSource.getRepository(Instructor_1.Instructor).update(instructor.id, {
            ...validatedData,
            updatedAt: new Date()
        });
        return res.status(200).json({ message: "Instructor updated successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.default.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }
        return res.status(500).json({ message: error });
    }
});
exports.default = router;
