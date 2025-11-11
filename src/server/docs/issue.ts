/**
 * @swagger
 * /issue:
 *   get:
 *     summary: Get all issues
 *     description: Returns a list of all issues, can filter by archived status
 *     tags:
 *       - Issue
 *     parameters:
 *       - in: query
 *         name: archived
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           example: "false"
 *         description: Filter by archived status. If "true", returns resolved issues. If "false", returns unresolved issues. If omitted, returns all issues.
 *     responses:
 *       200:
 *         description: List of issues
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
 *                   description:
 *                     type: string
 *                     example: "Criança com dificuldade respiratória durante o percurso"
 *                   imageURLs:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["image1.jpg", "image2.jpg"]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-15T11:00:00.000Z"
 *                   resolvedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: null
 *                   instructor:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *                       name:
 *                         type: string
 *                         example: "João Santos"
 *                       profilePictureURL:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/profile.jpg"
 *                   activitySession:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *                       type:
 *                         type: string
 *                         example: "BIKE"
 *                       routeName:
 *                         type: string
 *                         example: "Percurso do Parque"
 *                       scheduledAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T09:00:00.000Z"
 */


/**
 * @swagger
 * /issue/{id}:
 *   get:
 *     summary: Get issue by ID
 *     description: Returns a single issue by its ID
 *     tags:
 *       - Issue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Issue ID (UUID)
 *     responses:
 *       200:
 *         description: Issue found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 description:
 *                   type: string
 *                   example: "Bicicleta com pneu furado"
 *                 imageURLs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["bike_flat_tire.jpg"]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *                 resolvedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *                 instructor:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *                     name:
 *                       type: string
 *                       example: "João Santos"
 *                     profilePictureURL:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/profile.jpg"
 *                 activitySession:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *                     type:
 *                       type: string
 *                       example: "BIKE"
 *                     routeName:
 *                       type: string
 *                       example: "Percurso do Parque"
 *                     scheduledAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-10T09:00:00.000Z"
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue not found"
 */


/**
 * @swagger
 * /issue:
 *   post:
 *     summary: Create a new issue
 *     description: Creates a new issue report for an activity session with optional image uploads
 *     tags:
 *       - Issue
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - activitySessionId
 *               - instructorId
 *               - description
 *             properties:
 *               activitySessionId:
 *                 type: string
 *                 example: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *                 description: "Activity session ID where the issue occurred"
 *               instructorId:
 *                 type: string
 *                 example: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *                 description: "ID of the instructor reporting the issue"
 *               description:
 *                 type: string
 *                 example: "Criança caiu e apresenta escoriação no joelho"
 *                 description: "Detailed description of the issue"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: "Optional image files (JPEG, JPG, PNG, WEBP). Can upload none, one, or multiple images."
 *           example:
 *             activitySessionId: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *             instructorId: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *             description: "Problema técnico com bicicleta - corrente solta"
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue created successfully"
 *       400:
 *         description: Validation error or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 validation_error:
 *                   value:
 *                     message: "Validation error"
 *                     errors: [{"code": "required", "path": ["description"], "message": "Required"}]
 *                 invalid_file:
 *                   value:
 *                     message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)"
 *       404:
 *         description: Activity session or instructor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 activity_not_found:
 *                   value:
 *                     message: "Activity session not found"
 *                 instructor_not_found:
 *                   value:
 *                     message: "Instructor not found"
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /issue/resolve/toggle/{id}:
 *   put:
 *     summary: Toggle issue resolved status
 *     description: Marks an issue as resolved or reopens a resolved issue (toggles resolvedAt field)
 *     tags:
 *       - Issue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Issue ID (UUID)
 *     responses:
 *       200:
 *         description: Issue status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   description: "The ID of the updated issue"
 *                 resolvedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: "Date when issue was resolved (null if reopened)"
 *             examples:
 *               marked_resolved:
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   resolvedAt: "2024-01-15T14:30:00.000Z"
 *               reopened:
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   resolvedAt: null
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue not found"
 *       500:
 *         description: Internal server error
 */
