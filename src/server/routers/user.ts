import express, { Request, Response } from "express";
import { getAlphabeticOrderedUsers, searchSimilarUsers } from "../services/comms";

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
            return res.status(200).json(users);
        }

        if (typeof queryParam !== "string") {
            return res.status(400).json({ message: "Missing or invalid query parameter" });
        }

        const query = queryParam;
        const lowercaseQuery = query.toLowerCase();
        const querysize = lowercaseQuery.length;
        const users = await searchSimilarUsers(lowercaseQuery, pageNumber);
        return res.status(200).json(users);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
