/**
 * @swagger
 * /leaderboard/top/{type}:
 *   get:
 *     summary: Get leaderboard rankings
 *     description: >
 *       Returns leaderboard rankings for parents, children, schools, or school classes.
 *       Supports filtering by timeframe (monthly, annually, all_time), "back" parameter for previous periods,
 *       a "parameter" query to choose the ranking metric (distance, points, participations) and pagination via `page`.
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [parents, children, schools]
 *         description: Leaderboard type (parents, children, schools)
 *         example: parents
 *       - in: query
 *         name: timeframe
 *         required: false
 *         schema:
 *           type: string
 *           enum: [monthly, annually, all_time]
 *         description: Timeframe for leaderboard (monthly, annually, all_time)
 *         example: monthly
 *       - in: query
 *         name: back
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of periods back (0=current, 1=previous, etc.)
 *         example: 0
 *       - in: query
 *         name: parameter
 *         required: false
 *         schema:
 *           type: string
 *           enum: [distance, points, participations]
 *         description: Metric to order the leaderboard by. Defaults to "distance".
 *         example: distance
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for paginated results (page size is fixed server-side)
 *         example: 1
 *     responses:
 *       200:
 *         description: Leaderboard rankings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: parents
 *                 timeframe:
 *                   type: string
 *                   example: monthly
 *                 leaderboard:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       oneOf:
 *                         - type: object
 *                           description: Parent leaderboard entry
 *                           properties:
 *                             parentId:
 *                               type: string
 *                               example: "parent-uuid-1"
 *                             parentName:
 *                               type: string
 *                               example: "Maria Silva"
 *                             totalDistance:
 *                               type: number
 *                               example: 12000
 *                             totalParticipations:
 *                               type: integer
 *                               example: 8
 *                             totalPoints:
 *                               type: number
 *                               example: 150
 *                         - type: object
 *                           description: Child leaderboard entry
 *                           properties:
 *                             childId:
 *                               type: string
 *                               example: "child-uuid-1"
 *                             childName:
 *                               type: string
 *                               example: "João Faria"
 *                             totalDistance:
 *                               type: number
 *                               example: 8000
 *                             totalParticipations:
 *                               type: integer
 *                               example: 5
 *                             totalPoints:
 *                               type: number
 *                               example: 90
 *                         - type: object
 *                           description: School leaderboard entry
 *                           properties:
 *                             school:
 *                               type: string
 *                               example: "Escola Básica de Braga"
 *                             totalDistance:
 *                               type: number
 *                               example: 50000
 *                             totalParticipations:
 *                               type: integer
 *                               example: 40
 *                             totalPoints:
 *                               type: number
 *                               example: 600
 *       400:
 *         description: Invalid leaderboard type or bad query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid leaderboard type"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
