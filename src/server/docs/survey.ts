/**
 * @swagger
 * /survey/{id}:
 *   get:
 *     summary: Get survey by ID with questionnaire answers
 *     description: Retrieves a specific survey with questions and answers formatted for display
 *     tags:
 *       - Survey
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   section:
 *                     type: string
 *                     example: "Physical Activity"
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         context:
 *                           type: string
 *                           example: "Exercise habits"
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 *                             example:
 *                               "1":
 *                                 question: "How often does your child exercise?"
 *                                 answer: "Sometimes"
 *                         answerTypes:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Never", "Rarely", "Sometimes", "Often", "Always"]
 *       404:
 *         description: Survey not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Survey not found"
 *       403:
 *         description: Forbidden - You do not have permission to view this survey
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You do not have permission to view this survey"
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
 * /survey/document:
 *   get:
 *     summary: Get survey questionnaire template
 *     description: Retrieves the questionnaire template for a specific survey type
 *     tags:
 *       - Survey
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [child, parent]
 *         description: Type of survey questionnaire to retrieve
 *     responses:
 *       200:
 *         description: Survey questionnaire retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 intro:
 *                   type: string
 *                   example: "Welcome to the child survey questionnaire"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       section:
 *                         type: string
 *                         example: "Physical Activity"
 *                       data:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             context:
 *                               type: string
 *                               example: "Exercise habits"
 *                             questions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                               example:
 *                                 - "1": "How often does your child exercise?"
 *                                 - "2": "Does your child enjoy sports?"
 *                             answerTypes:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["Never", "Rarely", "Sometimes", "Often", "Always"]
 *       400:
 *         description: Invalid or missing surveyType parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or missing surveyType parameter"
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
 * /survey:
 *   post:
 *     summary: Submit a new survey
 *     description: Submits a completed survey for a specific child
 *     tags:
 *       - Survey
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - data
 *               - childId
 *               - notificationId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [child, parent]
 *                 description: Type of survey
 *                 example: "child"
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of survey answers
 *                 example:
 *                   - "1": 3
 *                   - "2": 5
 *                   - "3": 2
 *               childId:
 *                 type: string
 *                 description: ID of the child the survey is about
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               notificationId:
 *                 type: string
 *                 description: ID of the notification that triggered this survey submission
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Survey submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Survey submitted successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 invalid_type:
 *                   summary: Invalid survey type
 *                   value:
 *                     message: "Invalid or missing surveyType parameter"
 *                 invalid_child:
 *                   summary: Invalid child ID
 *                   value:
 *                     message: "Invalid or missing childId parameter"
 *                 invalid_notification:
 *                   summary: Invalid notification ID
 *                   value:
 *                     message: "Invalid or missing notificationId parameter"
 *                 invalid_data:
 *                   summary: Invalid data format
 *                   value:
 *                     message: "Data must be an array"
 *                 wrong_length:
 *                   summary: Wrong number of answers
 *                   value:
 *                     message: "Data must contain exactly 40 entries"
 *                 invalid_values:
 *                   summary: Invalid answer values
 *                   value:
 *                     message: "Each value must be an integer between 1 and 5"
 *                 already_submitted:
 *                   summary: Already submitted recently
 *                   value:
 *                     message: "Survey has already been submitted in the last week for this child"
 *       403:
 *         description: Forbidden - You are not the parent of this child
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You are not the parent of this child"
 *       404:
 *         description: Child not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 child_not_found:
 *                   summary: Child not found
 *                   value:
 *                     message: "Child not found"
 *                 notification_not_found:
 *                   summary: Notification not found
 *                   value:
 *                     message: "Notification not found"
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
 * /survey/child/{id}:
 *   get:
 *     summary: Get all surveys for a specific child
 *     description: Retrieves all surveys associated with a specific child
 *     tags:
 *       - Survey
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Surveys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "550e8400-e29b-41d4-a716-446655440000"
 *                   type:
 *                     type: string
 *                     enum: [child, parent]
 *                     example: "child"
 *                   child:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "550e8400-e29b-41d4-a716-446655440001"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                   parent:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "550e8400-e29b-41d4-a716-446655440002"
 *                       name:
 *                         type: string
 *                         example: "Jane Doe"
 *                   submittedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *       403:
 *         description: Forbidden - You do not have permission to view this survey
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You do not have permission to view this survey"
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
 * /survey/send-surveys:
 *   post:
 *     summary: Send survey reminders to all parents
 *     description: Sends survey reminder notifications to all parents for each of their children (both parent and child surveys)
 *     tags:
 *       - Survey
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All survey reminders sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All survey reminders sent successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied"
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
