/**
 * @swagger
 * /notification/user:
 *   get:
 *     summary: Get current user notifications
 *     description: Retrieve all notifications for the authenticated user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User notifications retrieved successfully
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
 *                   userId:
 *                     type: string
 *                     example: "user@example.com"
 *                   type:
 *                     type: string
 *                     example: "CHILD_CHECKED_IN"
 *                   title:
 *                     type: string
 *                     example: "Criança entrou na atividade"
 *                   description:
 *                     type: string
 *                     example: "A criança João Silva entrou na estação Escola Central na atividade pedibus."
 *                   isRead:
 *                     type: boolean
 *                     example: false
 *                   uri:
 *                     type: string
 *                     nullable: true
 *                     example: "/activity-session/b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: null
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
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


/**
 * @swagger
 * /notification/{id}:
 *   get:
 *     summary: Get notification by ID
 *     description: Retrieve a specific notification by ID. User must be authenticated and own the notification.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID
 *     responses:
 *       200:
 *         description: Notification found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 userId:
 *                   type: string
 *                   example: "user@example.com"
 *                 type:
 *                   type: string
 *                   example: "CHILD_MEDICAL_REPORT"
 *                 title:
 *                   type: string
 *                   example: "Relatório médico da criança"
 *                 description:
 *                   type: string
 *                   example: "A criança Maria Santos possui um novo relatório médico."
 *                 isRead:
 *                   type: boolean
 *                   example: true
 *                 uri:
 *                   type: string
 *                   nullable: true
 *                   example: "/medical-report/c3d4e5f6-g7h8-9012-cdef-345678901234"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-01-15T14:20:15.000Z"
 *       403:
 *         description: This notification does not belong to you
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: This notification does not belong to you
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */


/**
 * @swagger
 * /notification/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Delete a specific notification by ID. User must be authenticated and own the notification.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification deleted successfully
 *       403:
 *         description: This notification does not belong to you
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: This notification does not belong to you
 *       404:
 *         description: Notification not found or ID not provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     notFound: Notification not found
 *                     idRequired: Notification Id is required
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


/**
 * @swagger
 * /notification/{id}:
 *   put:
 *     summary: Mark a notification as read
 *     description: Mark a specific notification as read. User must be authenticated and own the notification.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification marked as read successfully
 *       403:
 *         description: This notification does not belong to you
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: This notification does not belong to you
 *       404:
 *         description: Notification not found or ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     notFound: Notification not found
 *                     idRequired: Notification Id is required
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