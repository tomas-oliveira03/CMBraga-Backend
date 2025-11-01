/**
 * @swagger
 * /health-professional:
 *   get:
 *     summary: Get all health professionals
 *     description: Returns a list of all health professionals
 *     tags:
 *       - Health Professional
 *     responses:
 *       200:
 *         description: List of health professionals
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
 *                     example: "Dr. João Silva"
 *                   email:
 *                     type: string
 *                     example: "joao.silva@cmbraga.pt"
 *                   phone:
 *                     type: string
 *                     example: "912345678"
 *                   specialty:
 *                     type: string
 *                     enum: [pediatrician, nutritionist, general_practitioner]
 *                     example: "pediatrician"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/doctor-1.jpg"
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
 * /health-professional/{id}:
 *   get:
 *     summary: Get health professional by ID
 *     description: Returns a single health professional by their ID
 *     tags:
 *       - Health Professional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Health Professional ID (UUID)
 *     responses:
 *       200:
 *         description: Health professional found
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
 *                   example: "Dr. Maria Santos"
 *                 email:
 *                   type: string
 *                   example: "maria.santos@cmbraga.pt"
 *                 phone:
 *                   type: string
 *                   example: "963852741"
 *                 specialty:
 *                   type: string
 *                   enum: [pediatrician, nutritionist, general_practitioner]
 *                   example: "nutritionist"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/doctor-2.jpg"
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
 *         description: Health professional not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health professional not found"
 */


/**
 * @swagger
 * /health-professional/{id}:
 *   put:
 *     summary: Update a health professional
 *     description: Updates an existing health professional
 *     tags:
 *       - Health Professional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Health Professional ID (UUID)
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
 *                 example: "Dr. Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               phone:
 *                 type: string
 *                 example: "987654321"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "nutritionist"
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
 *                 example: "Dr. Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               phone:
 *                 type: string
 *                 example: "987654321"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "nutritionist"
 *           example:
 *             name: "Dr. Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *             phone: "951753468"
 *             specialty: "pediatrician"
 *     responses:
 *       200:
 *         description: Health Professional updated successfully
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
 *         description: Health professional not found
 *       500:
 *         description: Internal server error
 */
