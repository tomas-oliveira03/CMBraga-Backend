/**
 * @swagger
 * /activity-session:
 *   get:
 *     summary: Get all activity sessions
 *     description: Returns a list of all activity sessions
 *     tags:
 *       - Activity Session
 *     responses:
 *       200:
 *         description: List of activity sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   type:
 *                     type: string
 *                     enum: [pedibus, ciclo_expresso]
 *                     example: "pedibus"
 *                   mode:
 *                     type: string
 *                     enum: [walk, bike]
 *                     example: "walk"
 *                     description: "Transportation mode (walk for pedibus, bike for ciclo_expresso)"
 *                   routeId:
 *                     type: string
 *                     nullable: true
 *                     example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                     description: "Associated route ID (UUID)"
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:00:00.000Z"
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T08:05:00.000Z"
 *                   finishedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T09:00:00.000Z"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T14:45:30.000Z"
 */


/**
 * @swagger
 * /activity-session/{id}:
 *   get:
 *     summary: Get activity session by ID
 *     description: Returns a single activity session by its ID, including a flattened stations array.
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity session found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 type:
 *                   type: string
 *                   enum: [pedibus, ciclo_expresso]
 *                   example: "ciclo_expresso"
 *                 mode:
 *                   type: string
 *                   enum: [walk, bike]
 *                   example: "bike"
 *                 routeId:
 *                   type: string
 *                   nullable: true
 *                   example: "c3d4e5f6-g7h8-9012-cdef-34567890123a"
 *                 scheduledAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T08:00:00.000Z"
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-01-20T08:05:00.000Z"
 *                 finishedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 stations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stationId:
 *                         type: string
 *                         example: "b8b395a0-9239-45cc-bd25-1173744dcbc2"
 *                       stopNumber:
 *                         type: integer
 *                         example: 1
 *                       scheduledAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-24T19:12:13.250Z"
 *                       arrivedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       leftAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       name:
 *                         type: string
 *                         example: "R. Manuel Ferreira Gomes"
 *                       type:
 *                         type: string
 *                         enum: [regular, school]
 *                         example: "regular"
 *                       latitude:
 *                         type: number
 *                         example: 41.553404
 *                       longitude:
 *                         type: number
 *                         example: -8.397567
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found"
 */


/**
 * @swagger
 * /activity-session:
 *   post:
 *     summary: Create a new activity session
 *     description: Creates a new activity session (Pedibus or Ciclo Expresso). The mode is automatically set based on type (pedibus=walk, ciclo_expresso=bike).
 *     tags:
 *       - Activity Session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - routeId
 *               - scheduledAt
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *                 description: "Activity type (mode will be auto-set: pedibus=walk, ciclo_expresso=bike)"
 *               routeId:
 *                 type: string
 *                 example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                 description: "Associated route ID (UUID)"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-25T08:00:00.000Z"
 *           example:
 *             type: "pedibus"
 *             routeId: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *             scheduledAt: "2024-01-25T08:00:00.000Z"
 *     responses:
 *       201:
 *         description: Activity session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session created successfully"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /activity-session/{id}:
 *   delete:
 *     summary: Delete an activity session
 *     description: Deletes an activity session by ID
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session deleted successfully"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found"
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
