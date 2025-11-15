/**
 * @swagger
 * /parent:
 *   get:
 *     summary: Get all parents
 *     description: Returns a list of all parents
 *     tags:
 *       - Parent
 *     responses:
 *       200:
 *         description: List of parents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *                   name:
 *                     type: string
 *                     example: "Maria Silva"
 *                   email:
 *                     type: string
 *                     example: "maria.silva@gmail.com"
 *                   phone:
 *                     type: string
 *                     example: "+351 912 345 678"
 *                   address:
 *                     type: string
 *                     example: "Rua das Flores, 123 - Braga"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/parent-1.jpg"
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
 * /parent/{id}:
 *   get:
 *     summary: Get parent by ID
 *     description: Returns a single parent by their ID
 *     tags:
 *       - Parent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *         description: Parent ID (UUID)
 *     responses:
 *       200:
 *         description: Parent found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *                 name:
 *                   type: string
 *                   example: "João Santos"
 *                 email:
 *                   type: string
 *                   example: "joao.santos@gmail.com"
 *                 phone:
 *                   type: string
 *                   example: "+351 967 890 123"
 *                 address:
 *                   type: string
 *                   example: "Avenida da Liberdade, 456 - Braga"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/parent-2.jpg"
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
 *         description: Parent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent not found"
 */


/**
 * @swagger
 * /parent/{id}:
 *   put:
 *     summary: Update a parent
 *     description: Updates an existing parent
 *     tags:
 *       - Parent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *         description: Parent ID (UUID)
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
 *                 example: "pedro.oliveira@gmail.com"
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Largo do Paço, 321 - Braga"
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
 *                 example: "pedro.oliveira@gmail.com"
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Largo do Paço, 321 - Braga"
 *           example:
 *             name: "Sofia Mendes"
 *             email: "sofia.mendes@gmail.com"
 *             phone: "+351 945 678 901"
 *     responses:
 *       200:
 *         description: Parent updated successfully
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
 *         description: Parent not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /parent/child:
 *   get:
 *     summary: Get all children from parent perspective
 *     description: Returns a list of all children associated with the authenticated parent
 *     tags:
 *       - Parent
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children for the parent
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "c3d4e5f6-g7h8-9012-cdef-g23456789012"
 *                   name:
 *                     type: string
 *                     example: "Ana Silva"
 *                   profilePictureURL:
 *                     type: string
 *                     nullable: true
 *                     example: "https://storage.example.com/profiles/child-1.jpg"
 *                   gender:
 *                     type: string
 *                     example: "Female"
 *                   heightCentimeters:
 *                     type: number
 *                     nullable: true
 *                     example: 120
 *                   weightKilograms:
 *                     type: number
 *                     nullable: true
 *                     example: 25.5
 *                   school:
 *                     type: string
 *                     nullable: true
 *                     example: "Escola EB1 de Braga"
 *                   schoolGrade:
 *                     type: string
 *                     nullable: true
 *                     example: "3º ano"
 *                   dropOffStation:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "d4e5f6g7-h8i9-0123-defg-h34567890123"
 *                       name:
 *                         type: string
 *                         example: "Estação Central de Braga"
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                     example: "2016-05-15"
 *                   healthProblems:
 *                     type: string
 *                     nullable: true
 *                     example: "Alergia a amendoins"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T14:45:30.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - User does not have parent role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden"
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
