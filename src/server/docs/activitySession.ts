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
 *                   inLateRegistration:
 *                     type: boolean
 *                     nullable: true
 *                     example: false
 *                   route:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                       name:
 *                         type: string
 *                         example: "Rota Centro"
 *                   weatherTemperature:
 *                     type: number
 *                     nullable: true
 *                     example: 18.5
 *                   weatherType:
 *                     type: string
 *                     nullable: true
 *                     example: "sunny"
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:00:00.000Z"
 *                   startedById:
 *                     type: string
 *                     nullable: true
 *                     example: "instructor-uuid-123"
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T08:05:00.000Z"
 *                   finishedById:
 *                     type: string
 *                     nullable: true
 *                     example: "instructor-uuid-456"
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
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   description: "The ID of the created activity session"
 *       400:
 *         description: Validation error or route type mismatch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               validation:
 *                 value:
 *                   message: "Validation error"
 *               type_mismatch:
 *                 value:
 *                   message: "Cannot link an activity to a different route type"
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
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


/**
 * @swagger
 * /activity-session/finished/instructor/{id}:
 *   get:
 *     summary: Get finished activity session statistics for instructor
 *     description: Returns detailed statistics for a finished activity session. Only accessible by instructors who were associated with the session.
 *     tags:
 *       - Activity Session
 *     security:
 *       - bearerAuth: []
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
 *         description: Finished activity session statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activity:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     type:
 *                       type: string
 *                       enum: [pedibus, ciclo_expresso]
 *                       example: "pedibus"
 *                     mode:
 *                       type: string
 *                       enum: [walk, bike]
 *                       example: "walk"
 *                 route:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                     name:
 *                       type: string
 *                       example: "Rota Centro"
 *                 schedule:
 *                   type: object
 *                   properties:
 *                     scheduledAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T08:00:00.000Z"
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T08:05:00.000Z"
 *                     finishedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T09:00:00.000Z"
 *                 weather:
 *                   type: object
 *                   properties:
 *                     temperature:
 *                       type: number
 *                       nullable: true
 *                       example: 18.5
 *                       description: "Weather temperature in Celsius"
 *                     type:
 *                       type: string
 *                       nullable: true
 *                       example: "sunny"
 *                       description: "Weather type/condition"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     durationMinutes:
 *                       type: integer
 *                       example: 55
 *                       description: "Duration in minutes (rounded)"
 *                     distanceMeters:
 *                       type: number
 *                       example: 2500
 *                       description: "Total route distance in meters"
 *                     totalParents:
 *                       type: integer
 *                       example: 12
 *                       description: "Number of parent participants"
 *                     totalChildren:
 *                       type: integer
 *                       example: 6
 *                       description: "Number of child participants (divided by 2)"
 *                     totalInstructors:
 *                       type: integer
 *                       example: 2
 *                       description: "Number of instructors in the session"
 *                     totalStops:
 *                       type: integer
 *                       example: 8
 *                       description: "Number of stations/stops in the route"
 *       400:
 *         description: Bad request - session not finished or instructor not associated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_finished:
 *                 value:
 *                   message: "Session not finished yet"
 *               not_associated:
 *                 value:
 *                   message: "Instructor not associated with this session"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - instructor role required
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
 */


/**
 * @swagger
 * /activity-session/finished/admin/{id}:
 *   get:
 *     summary: Get finished activity session statistics for admin
 *     description: Returns detailed statistics and station information for a finished activity session. Only accessible by admins.
 *     tags:
 *       - Activity Session
 *     security:
 *       - bearerAuth: []
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
 *         description: Finished activity session statistics with station details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activity:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     type:
 *                       type: string
 *                       enum: [pedibus, ciclo_expresso]
 *                       example: "pedibus"
 *                     mode:
 *                       type: string
 *                       enum: [walk, bike]
 *                       example: "walk"
 *                 route:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                     name:
 *                       type: string
 *                       example: "Rota Centro"
 *                 schedule:
 *                   type: object
 *                   properties:
 *                     scheduledAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T08:00:00.000Z"
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T08:05:00.000Z"
 *                     finishedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T09:00:00.000Z"
 *                 weather:
 *                   type: object
 *                   properties:
 *                     temperature:
 *                       type: number
 *                       nullable: true
 *                       example: 18.5
 *                       description: "Weather temperature in Celsius"
 *                     type:
 *                       type: string
 *                       nullable: true
 *                       example: "sunny"
 *                       description: "Weather type/condition"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     durationMinutes:
 *                       type: integer
 *                       example: 55
 *                       description: "Duration in minutes (rounded)"
 *                     distanceMeters:
 *                       type: number
 *                       example: 2500
 *                       description: "Total route distance in meters"
 *                     totalParents:
 *                       type: integer
 *                       example: 12
 *                       description: "Number of parent participants"
 *                     totalChildren:
 *                       type: integer
 *                       example: 6
 *                       description: "Number of child participants (divided by 2)"
 *                     totalInstructors:
 *                       type: integer
 *                       example: 2
 *                       description: "Number of instructors in the session"
 *                     totalStops:
 *                       type: integer
 *                       example: 8
 *                       description: "Number of stations/stops in the route"
 *                 stations:
 *                   type: array
 *                   description: "Detailed station information sorted by stop number"
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "b8b395a0-9239-45cc-bd25-1173744dcbc2"
 *                       name:
 *                         type: string
 *                         example: "R. Manuel Ferreira Gomes"
 *                       stopNumber:
 *                         type: integer
 *                         example: 1
 *                       scheduledAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-20T08:00:00.000Z"
 *                       arrivedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2024-01-20T08:02:00.000Z"
 *                       leftAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2024-01-20T08:05:00.000Z"
 *       400:
 *         description: Bad request - session not finished yet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not finished yet"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin role required
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
 */
