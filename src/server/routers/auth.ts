import express, { Request, Response } from "express";
import { z } from "zod";
import { AuthenticationService } from "../services/auth";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "@/helpers/types";
import { LoginSchema } from "../schemas/login";
import { envs } from "@/config";

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

// Mock routes to test different permission levels
/**
 * @swagger
 * /auth/test/admin-only:
 *   get:
 *     summary: Admin only test route
 *     description: Test route accessible only by admins
 *     tags:
 *       - Authentication Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - Admin access
 *       401:
 *         description: Authentication required - Invalid or missing token
 *       403:
 *         description: Insufficient permissions
 */
router.get('/test/admin-only', authenticate, authorize(UserRole.ADMIN), (req: Request, res: Response) => {
    return res.status(200).json({
        message: "Welcome, Admin! You have full access.",
        user: req.user
    });
});

/**
 * @swagger
 * /auth/test/instructor-parent:
 *   get:
 *     summary: Instructor and Parent test route
 *     description: Test route accessible by instructors and parents
 *     tags:
 *       - Authentication Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - Instructor or Parent access
 *       401:
 *         description: Authentication required - Invalid or missing token
 *       403:
 *         description: Insufficient permissions
 */
router.get('/test/instructor-parent', authenticate, authorize(UserRole.INSTRUCTOR, UserRole.PARENT), (req: Request, res: Response) => {
    return res.status(200).json({
        message: "Welcome, Instructor or Parent! You have limited access.",
        user: req.user
    });
});

/**
 * @swagger
 * /auth/test/health-professional:
 *   get:
 *     summary: Health Professional test route
 *     description: Test route accessible only by health professionals
 *     tags:
 *       - Authentication Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - Health Professional access
 *       401:
 *         description: Authentication required - Invalid or missing token
 *       403:
 *         description: Insufficient permissions
 */
router.get('/test/health-professional', authenticate, authorize(UserRole.HEALTH_PROFESSIONAL), (req: Request, res: Response) => {
    return res.status(200).json({
        message: "Welcome, Health Professional! You can access medical data.",
        user: req.user
    });
});

/**
 * @swagger
 * /auth/test/all-authenticated:
 *   get:
 *     summary: All authenticated users test route
 *     description: Test route accessible by any authenticated user
 *     tags:
 *       - Authentication Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - Any authenticated user
 *       401:
 *         description: Authentication required
 */
router.get('/test/all-authenticated', authenticate, (req: Request, res: Response) => {
    return res.status(200).json({
        message: "Welcome, authenticated user! This is accessible to all logged-in users.",
        user: req.user
    });
});

export default router;
