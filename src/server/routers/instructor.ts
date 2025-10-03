import { AppDataSource } from "@/db";
import { Instructor } from "@/db/entities/Instructor";
import express, { Request, Response } from "express";
import { CreateInstructorSchema, UpdateInstructorSchema } from "@/server/schemas/instructor";
import informationHash from "@/lib/information-hash"; // <-- import encryption utility

const router = express.Router();

/**
 * @swagger
 * /monitor:
 *   get:
 *     summary: Get all instructors
 *     description: Returns a list of all instructors
 *     tags:
 *       - Monitor
 *     responses:
 *       200:
 *         description: List of instructors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Instructor'
 */
router.get('/', async (req: Request, res: Response) => {
    const allInstructors = await AppDataSource.getRepository(Instructor).find();
    return res.status(200).json(allInstructors);
});

/**
 * @swagger
 * /monitor/{id}:
 *   get:
 *     summary: Get instructor by ID
 *     description: Returns a single instructor by their ID
 *     tags:
 *       - Monitor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instructor ID
 *     responses:
 *       200:
 *         description: Instructor found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Instructor'
 *       404:
 *         description: Instructor not found
 */
router.get('/:id', async (req: Request, res: Response) => {
    const instructorId = req.params.id;
    const instructor = await AppDataSource.getRepository(Instructor).findOne({
        where: {
            id: instructorId
        }
    });
    if (!instructor){
        return res.status(404).json({ message: "Instructor not found" })
    }
    return res.status(200).json(instructor);
});

/**
 * @swagger
 * /monitor/{id}:
 *   put:
 *     summary: Update instructor by ID
 *     description: Updates an instructor's information
 *     tags:
 *       - Monitor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instructor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instructor updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Instructor'
 *       404:
 *         description: Instructor not found
 */
router.put('/:id', async (req: Request, res: Response) => {
    const instructorId = req.params.id;
    const parseResult = UpdateInstructorSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid data", details: parseResult.error.issues });
    }
    const { name, email, phone } = parseResult.data;
    const instructorRepository = AppDataSource.getRepository(Instructor);
    const instructor = await instructorRepository.findOne({
        where: {
            id: instructorId
        }
    });
    if (!instructor){
        return res.status(404).json({ message: "Instructor not found" })
    }
    instructor.name = name || instructor.name;
    instructor.email = email || instructor.email;
    instructor.phone = phone || instructor.phone;
    await instructorRepository.save(instructor);
    return res.status(200).json(instructor);
});

/**
 * @swagger
 * /monitor:
 *   post:
 *     summary: Create a new instructor
 *     description: Adds a new instructor to the system
 *     tags:
 *       - Monitor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Instructor created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Instructor'
 */
router.post('/', async (req: Request, res: Response) => {
    const parseResult = CreateInstructorSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid data", details: parseResult.error.issues });
    }
    const { name, email, phone, password } = parseResult.data;
    const instructorRepository = AppDataSource.getRepository(Instructor);
    const encryptedPassword = informationHash.encrypt(password); // <-- encrypt password
    const newInstructor = instructorRepository.create({ name, email, phone, password: encryptedPassword });
    await instructorRepository.save(newInstructor);
    return res.status(201).json(newInstructor);
});

/**
 * @swagger
 * /monitor/password-reset/{id}:
 *   post:
 *     summary: Reset instructor password
 *     description: Updates the password for an instructor by ID
 *     tags:
 *       - Monitor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instructor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully."
 *       400:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid password. It must be at least 6 characters long."
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
 * 
 */
router.post('/password-reset/:id', async (req: Request, res: Response) => {
    const instructorId = req.params.id;
    const { newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: "Invalid password. It must be at least 6 characters long." });
    }
    const instructorRepository = AppDataSource.getRepository(Instructor);
    const instructor = await instructorRepository.findOne({
        where: {
            id: instructorId
        }
    });
    if (!instructor){
        return res.status(404).json({ message: "Instructor not found" })
    }
    instructor.password = informationHash.encrypt(newPassword); // <-- encrypt password
    await instructorRepository.save(instructor);
    return res.status(200).json({ message: "Password updated successfully." });
});

export default router;