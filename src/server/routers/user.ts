import express, { Request, Response } from "express";
import { getAlphabeticOrderedUsers, searchSimilarUsers, normalizeUsers } from "../services/comms";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import { UserRole } from "@/helpers/types";

const router = express.Router();

/**
 * @swagger
 * /user/search:
 *   get:
 *     summary: Search for users by a query string
 *     description: Returns a list of users whose names or other attributes match the query string.
 *     tags:
 *       - User
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query string
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: false
 *         description: The page number to retrieve
 *     responses:
 *       200:
 *         description: A list of matching users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The user's unique identifier
 *                   name:
 *                     type: string
 *                     description: The user's name
 *                   role:
 *                     type: string
 *                     description: The user's role
 *                     example: "admin"
 *       400:
 *         description: Missing or invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
router.get("/search",  async (req: Request, res: Response) => {
    try {
        const rawQuery = req.query.query;
        const rawPage = req.query.page;
        const pageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
        let pageNumber = 0;
        if (pageParam !== undefined) {
            const parsed = parseInt(pageParam as string, 10);
            if (isNaN(parsed) || parsed < 0) {
                return res.status(400).json({ message: "Invalid page parameter. Page must be an integer >= 0" });
            }
            pageNumber = parsed;
        }

        const queryParam = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;

        if (queryParam === undefined) {
            const users = await getAlphabeticOrderedUsers(pageNumber);
            return res.status(200).json(normalizeUsers(users));
        }

        if (typeof queryParam !== "string") {
            return res.status(400).json({ message: "Missing or invalid query parameter" });
        }

        const query = queryParam;
        const lowercaseQuery = query.toLowerCase();
        const querysize = lowercaseQuery.length;
        const users = await searchSimilarUsers(lowercaseQuery, pageNumber);
        if (!users) {
            return res.status(200).json([]);
        }
        return res.status(200).json(normalizeUsers(users));
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns a single user by their ID (email) with role information
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "user@example.com"
 *         description: User ID (email address)
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   description: The user's role-specific ID (adminId, instructorId, etc.)
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                   description: The user's email address
 *                 name:
 *                   type: string
 *                   example: "João Silva"
 *                   description: The user's full name
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/user-1.jpg"
 *                   description: URL to the user's profile picture
 *                 role:
 *                   type: string
 *                   enum: [admin, instructor, parent, health_professional]
 *                   example: "admin"
 *                   description: The user's role in the system
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
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
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        const user = await AppDataSource.getRepository(User).findOne({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                profilePictureURL: true,
                adminId: true,
                instructorId: true,
                healthProfessionalId: true,
                parentId: true
            }
        });
        if (!user){
            return res.status(404).json({ message: "User not found" })
        }

        let userRole = UserRole.ADMIN
        let clientId = user.adminId
        if (user.instructorId) { userRole = UserRole.INSTRUCTOR, clientId=user.instructorId }
        else if (user.healthProfessionalId) { userRole = UserRole.HEALTH_PROFESSIONAL, clientId=user.healthProfessionalId }
        else if (user.parentId) { userRole = UserRole.PARENT, clientId=user.parentId }

        return res.status(200).json({ 
            id: clientId,
            email: user.id,
            name: user.name,
            profilePictureURL: user.profilePictureURL,
            role: userRole
         });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;
