/**
 * @swagger
 * /badge:
 *   get:
 *     summary: Get all badges
 *     description: Returns a list of all badges
 *     tags:
 *       - Badge
 *     responses:
 *       200:
 *         description: List of badges
 */


/**
 * @swagger
 * /badge/{id}:
 *   get:
 *     summary: Get badge by ID
 *     description: Returns a single badge by its ID
 *     tags:
 *       - Badge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Badge found
 *       404:
 *         description: Badge not found
 */


/**
 * @swagger
 * /badge:
 *   post:
 *     summary: Create a new badge
 *     description: Creates a new badge
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBadge'
 *     responses:
 *       201:
 *         description: Badge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or name conflict
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * /badge/{id}:
 *   put:
 *     summary: Update a badge
 *     description: Updates an existing badge
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBadge'
 *     responses:
 *       200:
 *         description: Badge updated successfully
 *       400:
 *         description: Validation error or name conflict
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Badge not found
 */


/**
 * @swagger
 * /badge/{id}:
 *   delete:
 *     summary: Delete a badge
 *     description: Deletes a badge by ID
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Badge deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin)
 *       404:
 *         description: Badge not found
 */


/**
 * @swagger
 * /badge/profile/my-badges:
 *   get:
 *     summary: Get parent's own badges
 *     description: Returns badges assigned to the authenticated parent (not child-specific)
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of badges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */


/**
 * @swagger
 * /badge/profile/badges-to-achieve:
 *   get:
 *     summary: Get parent's badges progress to achieve
 *     description: Returns badges available for the authenticated parent and percentage progress towards each (excludes streak, leaderboard, special)
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of badges with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                   criteria:
 *                     type: string
 *                   valueneeded:
 *                     type: number
 *                   percentDone:
 *                     type: number
 *                     nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */


/**
 * @swagger
 * /badge/profile/children-badges:
 *   get:
 *     summary: Get a child's badges (parent only)
 *     description: Returns badges assigned to a specific child if the authenticated parent is linked to that child
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of child's badges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - parent not authorized for this child
 *       404:
 *         description: Child not found / no badges
 */


/**
 * @swagger
 * /badge/profile/children-badges-to-achieve:
 *   get:
 *     summary: Get a child's badges progress (parent only)
 *     description: Returns badges available for the specified child and percentage progress towards each (excludes streak, leaderboard, special). Requires query param childId.
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the child whose badge progress is requested
 *     responses:
 *       200:
 *         description: List of child's badges with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                   criteria:
 *                     type: string
 *                   valueneeded:
 *                     type: number
 *                   percentDone:
 *                     type: number
 *                     nullable: true
 *       400:
 *         description: Bad request (missing childId)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - parent not authorized for this child
 */


/**
 * @swagger
 * /badge/profile/children-badges-progress:
 *   get:
 *     summary: Get a child's badges progress (parent only)
 *     description: Returns all badges for the specified child and progress towards each (excludes streak, leaderboard, special). Requires query param childId. Only accessible by parents of the child.
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the child whose badge progress is requested
 *     responses:
 *       200:
 *         description: List of child's badges with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                   criteria:
 *                     type: string
 *                   valueneeded:
 *                     type: number
 *                   achieved:
 *                     type: boolean
 *                   percentDone:
 *                     type: number
 *                     nullable: true
 *       400:
 *         description: Bad request (missing childId)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - parent not authorized for this child
 */


/**
 * @swagger
 * /badge/profile/badges-progress:
 *   get:
 *     summary: Get parent's badges progress
 *     description: Returns all badges for the authenticated parent and progress towards each (excludes streak, leaderboard, special). Only accessible by parents.
 *     tags:
 *       - Badge
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parent's badges with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                   criteria:
 *                     type: string
 *                   valueneeded:
 *                     type: number
 *                   achieved:
 *                     type: boolean
 *                   percentDone:
 *                     type: number
 *                     nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */