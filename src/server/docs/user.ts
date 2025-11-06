/**
 * @swagger
 * /user/search:
 *   get:
 *     summary: Search for users by a query string
 *     description: Returns a list of users whose names or other attributes match the query string.
 *     tags:
 *       - User
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query string
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: false
 *         description: The page number to retrieve
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


/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by role-specific ID
 *     description: Returns a single user by their role-specific ID (adminId, instructorId, etc.) with role information.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: User's role-specific ID (adminId, instructorId, parentId, healthProfessionalId)
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   description: The user's role-specific ID (adminId, instructorId, etc.)
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                   description: The user's email address
 *                 name:
 *                   type: string
 *                   example: "João Silva"
 *                   description: The user's full name
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/user-1.jpg"
 *                   description: URL to the user's profile picture
 *                 role:
 *                   type: string
 *                   enum: [admin, instructor, parent, health_professional]
 *                   example: "admin"
 *                   description: The user's role in the system
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
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
 * /user/{conversationId}/search:
 *   get:
 *     summary: Search users not in a specific conversation
 *     description: >
 *       Returns users that are not members of the specified conversation. The search and paging
 *       parameters follow the same semantics as /user/search. The requesting user must be part
 *       of the conversation, otherwise a 403 is returned.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation/chat ID to exclude members from
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: false
 *         description: The search query string
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: false
 *         description: The page number to retrieve
 *     responses:
 *       200:
 *         description: A list of users not in the specified conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The user's unique identifier (email)
 *                   name:
 *                     type: string
 *                     description: The user's name
 *                   role:
 *                     type: string
 *                     description: The user's role
 *                   profilePictureURL:
 *                     type: string
 *                     description: URL to user's profile picture
 *       400:
 *         description: Missing or invalid parameters (e.g., page)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - requesting user is not part of the conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
