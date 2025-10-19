import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";

const router = express.Router();


/**
 * @swagger
 * /activity-session/station/{id}:
 *   get:
 *     summary: Get all stations from a specific activity session
 *     description: Returns a list of all station activity sessions for a specific activity session ID, ordered by stop number
 *     tags:
 *       - Activity Session - Stations
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
 *         description: List of station activity sessions for the specified activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   stopNumber:
 *                     type: integer
 *                     example: 1
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:15:00.000Z"
 *                   arrivedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:17:00.000Z"
 *                   leftAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:17:00.000Z"
 *                   station:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "Estação Central"
 *                       type:
 *                         type: string
 *                         enum: [regular, school]
 *                         example: "regular"
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
// Get all stations from an activity
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const activityId = req.params.id;
        
        const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activityId
            },
            relations: {
                stationActivitySessions: {
                    station: true
                }
            },
            select: {
                stationActivitySessions: {
                    stopNumber: true,
                    scheduledAt: true,
                    arrivedAt: true,
                    leftAt: true,
                    station: true
                }
            }
        });

        if (!activityInfo){
            return res.status(404).json({ message: "Activity not found" })
        }

        // Sort by stop number
        const sortedStations = activityInfo.stationActivitySessions.sort((a, b) => a.stopNumber - b.stopNumber);

        return res.status(200).json(sortedStations);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;