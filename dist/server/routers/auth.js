"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = require("../services/auth");
const auth_2 = require("../middleware/auth");
const auth_3 = require("../schemas/auth");
const config_1 = require("../../config");
const db_1 = require("../../db");
const User_1 = require("../../db/entities/User");
const information_hash_1 = __importDefault(require("../../lib/information-hash"));
const validator_1 = require("../services/validator");
const admin_1 = require("../schemas/admin");
const Admin_1 = require("../../db/entities/Admin");
const instructor_1 = require("../schemas/instructor");
const Instructor_1 = require("../../db/entities/Instructor");
const healthProfessional_1 = require("../schemas/healthProfessional");
const HealthProfessional_1 = require("../../db/entities/HealthProfessional");
const parent_1 = require("../schemas/parent");
const Parent_1 = require("../../db/entities/Parent");
const email_1 = require("../services/email");
const router = express_1.default.Router();
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
router.post('/login', async (req, res) => {
    try {
        const validatedData = auth_3.LoginSchema.parse(req.body);
        const result = await auth_1.AuthenticationService.login(validatedData);
        const wsUrl = `${config_1.envs.WEBSOCKET_BASE_URL}/ws?token=${result.token}`;
        return res.status(200).json({
            ...result,
            websocketURL: wsUrl
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/profile', auth_2.authenticate, (req, res) => {
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao.silva@cmbraga.pt"
 *           example:
 *             name: "Maria Santos"
 *             email: "maria.santos@cmbraga.pt"
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
router.post('/register/admin', async (req, res) => {
    try {
        const validatedData = admin_1.CreateAdminSchema.parse(req.body);
        const emailExists = await (0, validator_1.checkIfEmailExists)(validatedData.email);
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }
        await db_1.AppDataSource.transaction(async (tx) => {
            const admin = await tx.getRepository(Admin_1.Admin).insert(validatedData);
            const adminId = admin.identifiers[0]?.id;
            await tx.getRepository(User_1.User).insert({
                id: validatedData.email,
                name: validatedData.name,
                adminId: adminId
            });
        });
        await (0, email_1.sendPasswordReset)(validatedData.email, validatedData.name);
        return res.status(201).json({ message: "Admin created successfully" });
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
 *               phone:
 *                 type: string
 *                 example: "+351 912 345 678"
 *           example:
 *             name: "Ana Costa"
 *             email: "ana.costa@cmbraga.pt"
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
router.post('/register/instructor', async (req, res) => {
    try {
        const validatedData = instructor_1.CreateInstructorSchema.parse(req.body);
        const emailExists = await (0, validator_1.checkIfEmailExists)(validatedData.email);
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }
        await db_1.AppDataSource.transaction(async (tx) => {
            const instructor = await tx.getRepository(Instructor_1.Instructor).insert(validatedData);
            const instructorId = instructor.identifiers[0]?.id;
            await tx.getRepository(User_1.User).insert({
                id: validatedData.email,
                name: validatedData.name,
                instructorId: instructorId
            });
        });
        await (0, email_1.sendPasswordReset)(validatedData.email, validatedData.name);
        return res.status(201).json({ message: "Instructor created successfully" });
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
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "pediatrician"
 *           example:
 *             name: "Dra. Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
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
router.post('/register/health-professional', async (req, res) => {
    try {
        const validatedData = healthProfessional_1.CreateHealthProfessionalSchema.parse(req.body);
        const emailExists = await (0, validator_1.checkIfEmailExists)(validatedData.email);
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }
        await db_1.AppDataSource.transaction(async (tx) => {
            const healthProfessional = await tx.getRepository(HealthProfessional_1.HealthProfessional).insert(validatedData);
            const healthProfessionalId = healthProfessional.identifiers[0]?.id;
            await tx.getRepository(User_1.User).insert({
                id: validatedData.email,
                name: validatedData.name,
                healthProfessionalId: healthProfessionalId
            });
        });
        await (0, email_1.sendPasswordReset)(validatedData.email, validatedData.name);
        return res.status(201).json({ message: "Health Professional created successfully" });
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
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Rua das Flores, 123 - Braga"
 *           example:
 *             name: "Isabel Costa"
 *             email: "isabel.costa@gmail.com"
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
router.post('/register/parent', async (req, res) => {
    try {
        const validatedData = parent_1.CreateParentSchema.parse(req.body);
        const emailExists = await (0, validator_1.checkIfEmailExists)(validatedData.email);
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }
        await db_1.AppDataSource.transaction(async (tx) => {
            const parent = await tx.getRepository(Parent_1.Parent).insert(validatedData);
            const parentId = parent.identifiers[0]?.id;
            await tx.getRepository(User_1.User).insert({
                id: validatedData.email,
                name: validatedData.name,
                parentId: parentId
            });
        });
        await (0, email_1.sendPasswordReset)(validatedData.email, validatedData.name);
        return res.status(201).json({ message: "Parent created successfully" });
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
 * /auth/register/set-password:
 *   post:
 *     summary: Set password for instructor after registration
 *     description: Sets the password for an instructor using a token sent by email
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token received by email
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password to set
 *                 example: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password set successfully"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired token"
 */
router.post('/register/set-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = (0, email_1.verifyToken)(token);
        const email = decoded.userEmail;
        const hashedPassword = information_hash_1.default.encrypt(password);
        const user = await db_1.AppDataSource.getRepository(User_1.User).findOne({
            where: { id: email },
            select: {
                adminId: true,
                parentId: true,
                healthProfessionalId: true,
                instructorId: true
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.adminId) {
            await db_1.AppDataSource.createQueryBuilder().update(Admin_1.Admin)
                .set({
                password: hashedPassword,
                updatedAt: new Date(),
                activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
            })
                .where("id = :id", { id: user.adminId })
                .execute();
        }
        else if (user.instructorId) {
            await db_1.AppDataSource.createQueryBuilder().update(Instructor_1.Instructor)
                .set({
                password: hashedPassword,
                updatedAt: new Date(),
                activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
            })
                .where("id = :id", { id: user.instructorId })
                .execute();
        }
        else if (user.parentId) {
            await db_1.AppDataSource.createQueryBuilder().update(Parent_1.Parent)
                .set({
                password: hashedPassword,
                updatedAt: new Date(),
                activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
            })
                .where("id = :id", { id: user.parentId })
                .execute();
        }
        else if (user.healthProfessionalId) {
            await db_1.AppDataSource.createQueryBuilder().update(HealthProfessional_1.HealthProfessional)
                .set({
                password: hashedPassword,
                updatedAt: new Date(),
                activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
            })
                .where("id = :id", { id: user.healthProfessionalId })
                .execute();
        }
        else {
            throw new Error('User role not found');
        }
        return res.status(200).json({ message: "Password set successfully" });
    }
    catch (error) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
});
exports.default = router;
