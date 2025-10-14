"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../../db");
const express_1 = __importDefault(require("express"));
const ActivitySession_1 = require("../../../db/entities/ActivitySession");
const types_1 = require("../../../helpers/types");
const auth_1 = require("../../../server/middleware/auth");
const Instructor_1 = require("../../../db/entities/Instructor");
const InstructorActivitySession_1 = require("../../../db/entities/InstructorActivitySession");
const router = express_1.default.Router();
/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   get:
 *     summary: Get all instructors from a specific activity session
 *     description: Returns a list of all instructor activity sessions for a specific activity session ID
 *     tags:
 *       - Activity Session - Instructors
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of instructor activity sessions for the specified activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   assignedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-05T14:19:46.908Z"
 *                   instructor:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "João Silva"
 *                       email:
 *                         type: string
 *                         example: "joao.silva@cmbraga.pt"
 *                       phone:
 *                         type: string
 *                         example: "+351 925 678 901"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-05T14:22:01.592Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity not found"
 */
// Get all instructors from an activity
router.get('/:id', async (req, res) => {
    const activityId = req.params.id;
    const activityInfo = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            instructorActivitySessions: {
                instructor: true
            }
        },
        select: {
            instructorActivitySessions: {
                assignedAt: true,
                instructor: true
            }
        }
    });
    if (!activityInfo) {
        return res.status(404).json({ message: "Activity not found" });
    }
    return res.status(200).json(activityInfo?.instructorActivitySessions);
});
/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   post:
 *     summary: Assign instructor to an activity session
 *     description: Assigns an instructor to a specific activity session. Only admins can assign instructors.
 *     tags:
 *       - Activity Session - Instructors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructorId
 *             properties:
 *               instructorId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       201:
 *         description: Instructor successfully assigned to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor assigned to activity session successfully"
 *       400:
 *         description: Instructor already assigned to this activity session
 *       404:
 *         description: Activity session or instructor not found
 *       500:
 *         description: Internal server error
 */
// Assign instructor to an activity
router.post('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorId } = req.body;
        if (!instructorId) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        const instructor = await db_1.AppDataSource.getRepository(Instructor_1.Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        // Check if instructor is already assigned to this activity session
        const existingAssignment = await db_1.AppDataSource.getRepository(InstructorActivitySession_1.InstructorActivitySession).findOne({
            where: {
                instructorId: instructorId,
                activitySessionId: activitySessionId
            }
        });
        if (existingAssignment) {
            return res.status(400).json({ message: "Instructor is already assigned to this activity session" });
        }
        // Assign instructor to activity session
        await db_1.AppDataSource.getRepository(InstructorActivitySession_1.InstructorActivitySession).insert({
            instructorId: instructorId,
            activitySessionId: activitySessionId
        });
        return res.status(201).json({ message: "Instructor assigned to activity session successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   delete:
 *     summary: Remove instructor from an activity session
 *     description: Removes an instructor from a specific activity session. Only admins can remove instructors.
 *     tags:
 *       - Activity Session - Instructors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructorId
 *             properties:
 *               instructorId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       200:
 *         description: Instructor successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor removed from activity session successfully"
 *       400:
 *         description: Instructor not assigned to this activity session
 *       404:
 *         description: Activity session or instructor not found
 *       500:
 *         description: Internal server error
 */
// Remove instructor from an activity
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorId } = req.body;
        if (!instructorId) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        const instructor = await db_1.AppDataSource.getRepository(Instructor_1.Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        // Check if instructor is assigned to this activity session
        const existingAssignment = await db_1.AppDataSource.getRepository(InstructorActivitySession_1.InstructorActivitySession).findOne({
            where: {
                instructorId: instructorId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }
        // Remove instructor from activity session
        await db_1.AppDataSource.getRepository(InstructorActivitySession_1.InstructorActivitySession).delete({
            instructorId: instructorId,
            activitySessionId: activitySessionId
        });
        return res.status(200).json({ message: "Instructor removed from activity session successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
exports.default = router;
