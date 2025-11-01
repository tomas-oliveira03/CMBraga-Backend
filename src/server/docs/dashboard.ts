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
 
/**
 * @swagger
 * /dashboard/users:
 *   get:
 *     summary: Get paginated users (admin only)
 *     description: >
 *       Returns a paginated list of users. Requires authentication and ADMIN authorization.
 *       Optional query parameter `role` filters users by role (only users that have the corresponding role-specific id).
 *       When requesting the first page (page=1) the response will also include countsByRole and total.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (defaults to 1)
 *         example: 1
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, INSTRUCTOR, PARENT, HEALTH_PROFESSIONAL]
 *         description: Filter users by role (use enum values)
 *         example: ADMIN
 *     responses:
 *       200:
 *         description: Paginated users list (first page includes countsByRole and total)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "u1v2w3x4-5678-90ab-cdef-1234567890ab"
 *                           name:
 *                             type: string
 *                             example: "João Faria"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "joao@example.com"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-02-01T08:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                     total:
 *                       type: integer
 *                       example: 123
 *                     countsByRole:
 *                       type: object
 *                       properties:
 *                         admin:
 *                           type: integer
 *                           example: 5
 *                         instructor:
 *                           type: integer
 *                           example: 20
 *                         parent:
 *                           type: integer
 *                           example: 80
 *                         health_professional:
 *                           type: integer
 *                           example: 18
 *                     page:
 *                       type: integer
 *                       example: 1
 *                 - type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "u1v2w3x4-5678-90ab-cdef-1234567890ab"
 *                           name:
 *                             type: string
 *                             example: "João Faria"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "joao@example.com"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-02-01T08:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                     page:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Invalid query parameter (page must be numeric or role invalid)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid page query parameter"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden (insufficient role)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
