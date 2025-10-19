import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";


const router = express.Router();

/**
 * @swagger
 * /dashboard/issue/activity/{id}:
 *   get:
 *     summary: Get activity session by ID (with issues)
 *     description: Returns an activity session with its details and associated issues for a given activity session ID.
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *         description: Activity session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity session with issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "bike_ride"
 *                 scheduledAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-03-01T09:00:00.000Z"
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-03-01T09:05:00.000Z"
 *                 finishedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-03-01T10:00:00.000Z"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-02-25T08:00:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-03-01T11:00:00.000Z"
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                       description:
 *                         type: string
 *                         example: "Criança com dificuldade respiratória durante o percurso"
 *                       imageURLs:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["image1.jpg", "image2.jpg"]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-01T09:30:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2024-03-01T10:15:00.000Z"
 *                       resolvedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       instructorId:
 *                         type: string
 *                         example: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *       404:
 *         description: Activity not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity not found"
 */
router.get('/issue/activity/:id', async (req: Request, res : Response) => {
    try {
        const activityId = req.params.id;
        const activity = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activityId }, 
            relations: {
                issues: true
            },
            select: {
                id: true,
                type: true,
                scheduledAt: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
                updatedAt: true,
                issues:{
                    id: true,
                    description: true,
                    imageURLs: true,
                    createdAt: true,
                    updatedAt: true,
                    resolvedAt: true,
                    instructorId: true
                }
            }
        })
        
        if(!activity){
            return res.status(404).json({ message: "Activity not found" });
        }

        return res.status(200).json(activity)
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})

export default router;
