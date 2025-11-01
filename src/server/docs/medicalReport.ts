/**
 * @swagger
 * /medical-report/child/{id}:
 *   get:
 *     summary: Get medical reports for a child
 *     description: Returns the list of medical reports for a given child, including the diagnosis, recommendations and the health professional details.
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of medical reports for the child
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
 *                   diagnosis:
 *                     type: string
 *                     example: "Asma brônquica leve"
 *                   recommendations:
 *                     type: string
 *                     nullable: true
 *                     example: "Evitar ambientes com fumo e poeira"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   healthProfessional:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *                       name:
 *                         type: string
 *                         example: "Dr. João Pereira"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "joao.pereira@hospital.pt"
 *                       specialty:
 *                         type: string
 *                         example: "Pediatria"
 *       404:
 *         description: Child not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child not found"
 */


/**
 * @swagger
 * /medical-report:
 *   get:
 *     summary: Get all medical reports
 *     description: Returns a list of all medical reports
 *     tags:
 *       - Medical Report
 *     responses:
 *       200:
 *         description: List of medical reports
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
 *                   childId:
 *                     type: string
 *                     example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *                   healthProfessionalId:
 *                     type: string
 *                     example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *                   diagnosis:
 *                     type: string
 *                     example: "Asma brônquica leve"
 *                   recommendations:
 *                     type: string
 *                     nullable: true
 *                     example: "Evitar ambientes com fumo e poeira"
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
 * /medical-report/{id}:
 *   get:
 *     summary: Get medical report by ID
 *     description: Returns a single medical report by its ID
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Medical Report ID (UUID)
 *     responses:
 *       200:
 *         description: Medical report found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 childId:
 *                   type: string
 *                   example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *                 healthProfessionalId:
 *                   type: string
 *                   example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *                 diagnosis:
 *                   type: string
 *                   example: "Rinite alérgica"
 *                 recommendations:
 *                   type: string
 *                   nullable: true
 *                   example: "Medicação antihistamínica conforme necessário"
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
 *         description: Medical report not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report not found"
 */


/**
 * @swagger
 * /medical-report:
 *   post:
 *     summary: Create a new medical report
 *     description: Creates a new medical report for a child
 *     tags:
 *       - Medical Report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - healthProfessionalId
 *               - diagnosis
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *               healthProfessionalId:
 *                 type: string
 *                 example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *               diagnosis:
 *                 type: string
 *                 example: "Alergia alimentar a frutos secos"
 *               recommendations:
 *                 type: string
 *                 nullable: true
 *                 example: "Evitar completamente frutos secos e derivados"
 *           example:
 *             childId: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *             healthProfessionalId: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *             diagnosis: "Dermatite atópica moderada"
 *             recommendations: "Hidratar a pele duas vezes ao dia"
 *     responses:
 *       201:
 *         description: Medical report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medical report added successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Child or health professional not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /medical-report/{id}:
 *   put:
 *     summary: Update a medical report
 *     description: Updates an existing medical report
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Medical Report ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: string
 *                 example: "Asma brônquica moderada (atualização)"
 *               recommendations:
 *                 type: string
 *                 nullable: true
 *                 example: "Medicação inalatória diária e evitar exercício intenso"
 *           example:
 *             diagnosis: "Rinite alérgica sazonal"
 *             recommendations: "Tratamento com corticosteroides nasais durante primavera"
 *     responses:
 *       200:
 *         description: Medical report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Medical report not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /medical-report/{id}:
 *   delete:
 *     summary: Delete a medical report
 *     description: Deletes a medical report by ID
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Medical Report ID (UUID)
 *     responses:
 *       200:
 *         description: Medical report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report deleted successfully"
 *       404:
 *         description: Medical report not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report not found"
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
