/**
 * @swagger
 * /activity-session/parent:
 *   get:
 *     summary: Get all parents from a specific activity session
 *     description: Returns a list of all parent activity sessions for a specific activity session ID.
 *     tags:
 *       - Activity Session - Parents
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of parent activity sessions for the specified activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   registeredAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-05T14:19:46.908Z"
 *                   parent:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "Maria Silva"
 *       400:
 *         description: Missing or invalid activity ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity ID is required"
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
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /activity-session/parent:
 *   post:
 *     summary: Assign the authenticated parent to an activity session
 *     description: Assigns the currently authenticated parent (from the JWT) to a specific activity session. Only authenticated users with the parent role can perform this action.
 *     tags:
 *       - Activity Session - Parents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       201:
 *         description: Parent successfully assigned to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent assigned to activity session successfully"
 *       400:
 *         description: Missing required parameter or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity Session ID is required"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Parent role required
 *       404:
 *         description: Activity session or parent not found
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
 *                 parent_not_found:
 *                   value:
 *                     message: "Parent not found"
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /activity-session/parent:
 *   delete:
 *     summary: Remove the authenticated parent from an activity session
 *     description: Removes the currently authenticated parent (from the JWT) from a specific activity session. Only authenticated users with the parent role can perform this action.
 *     tags:
 *       - Activity Session - Parents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Parent successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent removed from activity session successfully"
 *       400:
 *         description: Missing required parameter or parent not assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 missing_params:
 *                   value:
 *                     message: "Activity Session ID is required"
 *                 not_assigned:
 *                   value:
 *                     message: "Parent is not assigned to this activity session"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Parent role required
 *       404:
 *         description: Activity session or parent not found
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
 *                 parent_not_found:
 *                   value:
 *                     message: "Parent not found"
 *       500:
 *         description: Internal server error
 */
