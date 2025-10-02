import express, { Request, Response } from "express";

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API service
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             example:
 *               status: "OK"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *               uptime: 3600.5
 */
// Check the health of the service
router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default router;
