"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comms_1 = require("../services/comms");
const router = express_1.default.Router();
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
router.get("/search", async (req, res) => {
    const query = req.query.query;
    if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Missing or invalid query parameter" });
    }
    const lowercaseQuery = query.toLowerCase();
    const users = await (0, comms_1.searchSimilarUsers)(lowercaseQuery);
    return res.json(users);
});
exports.default = router;
