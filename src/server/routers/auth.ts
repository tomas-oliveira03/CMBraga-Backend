import express, { Request, Response } from "express";
import { z } from "zod";
import { AuthenticationService } from "../services/auth";
import { authenticate, authorize } from "../middleware/auth";
import { LoginSchema, RegisterSchema } from "../schemas/auth";
import { envs } from "@/config";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import informationHash from "@/lib/information-hash";
import { checkIfEmailExists } from "../services/validator";
import { CreateAdminSchema } from "../schemas/admin";
import { Admin } from "@/db/entities/Admin";
import { CreateInstructorSchema } from "../schemas/instructor";
import { Instructor } from "@/db/entities/Instructor";
import { CreateHealthProfessionalSchema } from "../schemas/healthProfessional";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { CreateParentSchema } from "../schemas/parent";
import { Parent } from "@/db/entities/Parent";

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@cmbraga.pt"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, instructor, parent, health_professional]
 *                 websocketURL:
 *                   type: string
 *                   description: WebSocket URL for real-time updates
 *                   example: "ws://localhost:3001/ws?token=your_jwt_token"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = LoginSchema.parse(req.body);
        const result = await AuthenticationService.login(validatedData);

        const wsUrl = `${envs.WEBSOCKET_BASE_URL}/ws?token=${result.token}`;
        
        return res.status(200).json({
            ...result,
            websocketURL: wsUrl 
        });
        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }
        
        return res.status(401).json({ message: "Invalid email or password" });
    }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Authentication required
 */
router.get('/profile', authenticate, (req: Request, res: Response) => {
    return res.status(200).json({
        message: "Profile retrieved successfully",
        user: req.user
    });
});

/**
 * @swagger
 * /auth/register/admin:
 *   post:
 *     summary: Register a new admin
 *     description: Creates a new admin user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao.silva@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "SecurePassword123!"
 *           example:
 *             name: "Maria Santos"
 *             email: "maria.santos@cmbraga.pt"
 *             password: "AdminPass2024!"
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin created successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email already exists"
 *       500:
 *         description: Internal server error
 */
router.post('/register/admin', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateAdminSchema.parse(req.body);
        
        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }
        validatedData.password = informationHash.encrypt(validatedData.password);

        await AppDataSource.transaction(async tx => {
            
            const admin = await tx.getRepository(Admin).insert(validatedData);
            const adminId = admin.identifiers[0]?.id

            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                adminId: adminId
            });
        })
        
        return res.status(201).json({message: "Admin created successfully"});

    } catch (error) {
        if (error instanceof z.ZodError) {
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
 * /auth/register/instructor:
 *   post:
 *     summary: Register a new instructor
 *     description: Creates a new instructor user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Carlos Pereira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "carlos.pereira@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "InstructorPass123!"
 *               phone:
 *                 type: string
 *                 example: "+351 912 345 678"
 *           example:
 *             name: "Ana Costa"
 *             email: "ana.costa@cmbraga.pt"
 *             password: "InstructorPass2024!"
 *             phone: "+351 923 456 789"
 *     responses:
 *       201:
 *         description: Instructor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor created successfully"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register/instructor', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateInstructorSchema.parse(req.body);

        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }
        validatedData.password = informationHash.encrypt(validatedData.password);

        await AppDataSource.transaction(async tx => {

            const instructor = await tx.getRepository(Instructor).insert(validatedData);
            const instructorId = instructor.identifiers[0]?.id

            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                instructorId: instructorId
            });
        })
        
        return res.status(201).json({message: "Instructor created successfully"});

    } catch (error) {
        if (error instanceof z.ZodError) {
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
 * /auth/register/health-professional:
 *   post:
 *     summary: Register a new health professional
 *     description: Creates a new health professional user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - specialty
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Dr. Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "DoctorPass123!"
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "pediatrician"
 *           example:
 *             name: "Dra. Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *             password: "HealthProPass2024!"
 *             specialty: "nutritionist"
 *     responses:
 *       201:
 *         description: Health Professional created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health Professional created successfully"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register/health-professional', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateHealthProfessionalSchema.parse(req.body);

        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }
        validatedData.password = informationHash.encrypt(validatedData.password);

        await AppDataSource.transaction(async tx => {

            const healthProfessional = await tx.getRepository(HealthProfessional).insert(validatedData);
            const healthProfessionalId = healthProfessional.identifiers[0]?.id

            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                healthProfessionalId: healthProfessionalId
            });
        })
        
        return res.status(201).json({message: "Health Professional created successfully"});

    } catch (error) {
        if (error instanceof z.ZodError) {
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
 * /auth/register/parent:
 *   post:
 *     summary: Register a new parent
 *     description: Creates a new parent user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Ricardo Mendes"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ricardo.mendes@gmail.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "ParentPass123!"
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Rua das Flores, 123 - Braga"
 *           example:
 *             name: "Isabel Costa"
 *             email: "isabel.costa@gmail.com"
 *             password: "ParentPass2024!"
 *             phone: "+351 945 678 901"
 *             address: "Avenida da Liberdade, 456 - Braga"
 *     responses:
 *       201:
 *         description: Parent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent created successfully"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register/parent', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateParentSchema.parse(req.body);

        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }
        validatedData.password = informationHash.encrypt(validatedData.password);

        await AppDataSource.transaction(async tx => {

            const parent = await tx.getRepository(Parent).insert(validatedData);
            const parentId = parent.identifiers[0]?.id

            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                parentId: parentId
            });
        })
        
        return res.status(201).json({message: "Parent created successfully"});

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }
        
        return res.status(500).json({ message: error });
    }
});

export default router;
