/**
 * @swagger
 * /activity-session/instructor/all/{id}:
 *   get:
 *     summary: Get all instructors with assignment status for an activity session
 *     description: Returns a list of all instructors in the system with a flag indicating whether each instructor is assigned to the specified activity session. Useful for displaying instructor selection UI.
 *     tags:
 *       - Activity Session - Instructors
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of all instructors with assignment status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   instructorId:
 *                     type: string
 *                     format: uuid
 *                     example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                     description: Unique identifier of the instructor
 *                   instructorName:
 *                     type: string
 *                     example: "João Silva"
 *                     description: Full name of the instructor
 *                   profilePictureURL:
 *                     type: string
 *                     format: uri
 *                     example: "https://storage.example.com/profiles/instructor-123.jpg"
 *                     description: URL to the instructor's profile picture
 *                   isAssigned:
 *                     type: boolean
 *                     example: true
 *                     description: True if the instructor is already assigned to this activity session, false otherwise
 *             examples:
 *               mixedAssignments:
 *                 summary: Mix of assigned and unassigned instructors
 *                 value:
 *                   - instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                     instructorName: "João Silva"
 *                     profilePictureURL: "https://storage.example.com/profiles/joao.jpg"
 *                     isAssigned: true
 *                   - instructorId: "2abc1234-12ab-34cd-56ef-123456789012"
 *                     instructorName: "Maria Santos"
 *                     profilePictureURL: "https://storage.example.com/profiles/maria.jpg"
 *                     isAssigned: true
 *                   - instructorId: "3def5678-90gh-12ij-34kl-567890123456"
 *                     instructorName: "Pedro Costa"
 *                     profilePictureURL: "https://storage.example.com/profiles/pedro.jpg"
 *                     isAssigned: false
 *                   - instructorId: "4ghi7890-12jk-34lm-56no-678901234567"
 *                     instructorName: "Ana Ferreira"
 *                     profilePictureURL: "https://storage.example.com/profiles/ana.jpg"
 *                     isAssigned: false
 *               allUnassigned:
 *                 summary: No instructors assigned yet
 *                 value:
 *                   - instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                     instructorName: "João Silva"
 *                     profilePictureURL: "https://storage.example.com/profiles/joao.jpg"
 *                     isAssigned: false
 *                   - instructorId: "2abc1234-12ab-34cd-56ef-123456789012"
 *                     instructorName: "Maria Santos"
 *                     profilePictureURL: "https://storage.example.com/profiles/maria.jpg"
 *                     isAssigned: false
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


/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   post:
 *     summary: Assign instructors to an activity session
 *     description: Assigns one or more instructors to a specific activity session. Only admins can assign instructors.
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
 *               - instructorIds
 *             properties:
 *               instructorIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["1bee5237-02ea-4f5c-83f3-bfe6e5a19756", "2abc1234-12ab-34cd-56ef-123456789012"]
 *           example:
 *             instructorIds: ["1bee5237-02ea-4f5c-83f3-bfe6e5a19756", "2abc1234-12ab-34cd-56ef-123456789012"]
 *     responses:
 *       201:
 *         description: Instructors successfully assigned to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructors assigned to activity session successfully"
 *       400:
 *         description: One or more instructors already assigned to this activity session or invalid input
 *       404:
 *         description: Activity session not found or one or more instructors not found
 *       500:
 *         description: Internal server error
 */


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