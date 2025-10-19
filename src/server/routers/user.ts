import express, { Request, Response } from "express";
import { searchSimilarUsers } from "../services/comms";

const router = express.Router();

/**
 * @swagger
 * /user/search:
 *   get:
 *     summary: Search for users by a query string
 *     description: Returns a list of users whose names or other attributes match the query string.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query string
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
        const query = req.query.query;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ message: "Missing or invalid query parameter" });
        }
        const lowercaseQuery = query.toLowerCase();
        const users = await searchSimilarUsers(lowercaseQuery);
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
