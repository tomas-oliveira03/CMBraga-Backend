/**
 * @swagger
 * /instructor:
 *   get:
 *     summary: Get all instructors
 *     description: Returns a list of all instructors
 *     tags:
 *       - Instructor
 *     responses:
 *       200:
 *         description: List of instructors
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
 *                   name:
 *                     type: string
 *                     example: "Maria Silva"
 *                   email:
 *                     type: string
 *                     example: "maria.silva@cmbraga.pt"
 *                   phone:
 *                     type: string
 *                     example: "+351 912 345 678"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/instructor-1.jpg"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T14:45:30.000Z"
 */


/**
 * @swagger
 * /instructor/{id}:
 *   get:
 *     summary: Get instructor by ID
 *     description: Returns a single instructor by their ID
 *     tags:
 *       - Instructor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Instructor ID (UUID)
 *     responses:
 *       200:
 *         description: Instructor found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 name:
 *                   type: string
 *                   example: "João Santos"
 *                 email:
 *                   type: string
 *                   example: "joao.santos@cmbraga.pt"
 *                 phone:
 *                   type: string
 *                   example: "+351 925 678 901"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/instructor-2.jpg"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Instructor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor not found"
 */


/**
 * @swagger
 * /instructor/{id}:
 *   put:
 *     summary: Update an instructor
 *     description: Updates an existing instructor
 *     tags:
 *       - Instructor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Instructor ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               phone:
 *                 type: string
 *                 example: "+351 937 890 123"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Profile picture image file (JPEG, JPG, PNG, WEBP)"
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               phone:
 *                 type: string
 *                 example: "+351 937 890 123"
 *           example:
 *             name: "Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *             phone: "+351 968 123 456"
 *     responses:
 *       200:
 *         description: Instructor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 name:
 *                   type: string
 *                   example: "Pedro Oliveira"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/admin-1.jpg"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T14:45:30.000Z"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Instructor not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /instructor/next-activities/{id}:
 *   get:
 *     summary: Get instructor's next activities
 *     description: Returns all ongoing and upcoming activities for a specific instructor
 *     tags:
 *       - Instructor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Instructor ID (UUID)
 *     responses:
 *       200:
 *         description: List of instructor's next activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [upcoming, ongoing]
 *                     example: "upcoming"
 *                   activity:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                       type:
 *                         type: string
 *                         example: "GUIDED_TOUR"
 *                       mode:
 *                         type: string
 *                         example: "WALKING"
 *                       scheduledAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-25T14:30:00.000Z"
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-25T14:32:15.000Z"
 *                         description: "Only present if activity has started"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-20T10:15:30.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-22T16:45:22.000Z"
 *                   route:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "c3d4e5f6-g7h8-9012-cdef-345678901234"
 *                       name:
 *                         type: string
 *                         example: "Historic Center Route"
 *       404:
 *         description: Instructor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database connection error"
 */
