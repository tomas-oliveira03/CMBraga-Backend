/**
 * @swagger
 * /activity-session/child/{id}:
 *   get:
 *     summary: Get all children from a specific activity session
 *     description: Returns a list of all child activity sessions for a specific activity session ID
 *     tags:
 *       - Activity Session - Children
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
 *         description: List of child activity sessions for the specified activity
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
 *                   child:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "Ana Costa"
 *                       gender:
 *                         type: string
 *                         enum: [male, female]
 *                         example: "female"
 *                       school:
 *                         type: string
 *                         example: "Escola Básica de Braga"
 *                       schoolGrade:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 12
 *                         example: 2
 *                       dateOfBirth:
 *                         type: string
 *                         format: date
 *                         example: "2016-02-14"
 *                       healthProblems:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           allergies:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["lactose"]
 *                           chronicDiseases:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: []
 *                           surgeries:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 type:
 *                                   type: string
 *                                 year:
 *                                   type: number
 *                             example: []
 *                       dropOffStationId:
 *                         type: string
 *                         example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                         description: "School station ID where the child is dropped off"
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
 * /activity-session/child/available-stations/{id}:
 *   get:
 *     summary: Get available pickup stations for a child in an activity session
 *     description: Returns a list of all stations in the activity session with availability flags based on the child's drop-off station. Stations with stop numbers less than the child's drop-off station are available for pickup.
 *     tags:
 *       - Activity Session - Children
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of stations with availability flags for the specified child
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   stopNumber:
 *                     type: integer
 *                     example: 1
 *                     description: "Sequential stop number in the route"
 *                   isAvailable:
 *                     type: boolean
 *                     example: true
 *                     description: "True if station is available for pickup (before drop-off station), false otherwise"
 *                   id:
 *                     type: string
 *                     example: "station-uuid-1"
 *                     description: "Station ID (UUID)"
 *                   name:
 *                     type: string
 *                     example: "Estação Central"
 *                     description: "Station name"
 *                   type:
 *                     type: string
 *                     enum: [regular, school]
 *                     example: "regular"
 *                     description: "Station type"
 *               example:
 *                 - stopNumber: 1
 *                   isAvailable: true
 *                   id: "station-uuid-1"
 *                   name: "Estação Central"
 *                   type: "regular"
 *                 - stopNumber: 2
 *                   isAvailable: true
 *                   id: "station-uuid-2"
 *                   name: "Biblioteca"
 *                   type: "regular"
 *                 - stopNumber: 3
 *                   isAvailable: false
 *                   id: "station-uuid-3"
 *                   name: "Escola Básica"
 *                   type: "school"
 *       400:
 *         description: Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 missing_child_id:
 *                   value:
 *                     message: "ChildId is required"
 *                 station_not_in_route:
 *                   value:
 *                     message: "Child's drop-off station not found in this activity session"
 *       404:
 *         description: Activity session or child not found
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
 *                 child_not_found:
 *                   value:
 *                     message: "Child not found"
 */


/**
 * @swagger
 * /activity-session/child/all/{id}:
 *   get:
 *     summary: Get all parent's children with registration status for an activity session
 *     description: Returns a list of all children belonging to the authenticated parent with a flag indicating whether each child is registered for the specified activity session. Useful for displaying child selection UI when registering for activities.
 *     tags:
 *       - Activity Session - Children
 *     security:
 *       - bearerAuth: []
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
 *         description: List of parent's children with registration status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   childId:
 *                     type: string
 *                     format: uuid
 *                     example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                     description: Unique identifier of the child
 *                   childName:
 *                     type: string
 *                     example: "Ana Costa"
 *                     description: Full name of the child
 *                   profilePictureURL:
 *                     type: string
 *                     format: uri
 *                     example: "https://storage.example.com/profiles/child-123.jpg"
 *                     description: URL to the child's profile picture
 *                   isRegistered:
 *                     type: boolean
 *                     example: true
 *                     description: True if the child is already registered for this activity session, false otherwise
 *             examples:
 *               mixedRegistrations:
 *                 summary: Mix of registered and unregistered children
 *                 value:
 *                   - childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                     childName: "Ana Costa"
 *                     profilePictureURL: "https://storage.example.com/profiles/ana.jpg"
 *                     isRegistered: true
 *                   - childId: "2abc1234-12ab-34cd-56ef-123456789012"
 *                     childName: "Carlos Pereira"
 *                     profilePictureURL: "https://storage.example.com/profiles/carlos.jpg"
 *                     isRegistered: true
 *                   - childId: "3def5678-90gh-12ij-34kl-567890123456"
 *                     childName: "Maria Silva"
 *                     profilePictureURL: "https://storage.example.com/profiles/maria.jpg"
 *                     isRegistered: false
 *               allUnregistered:
 *                 summary: No children registered yet
 *                 value:
 *                   - childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                     childName: "Ana Costa"
 *                     profilePictureURL: "https://storage.example.com/profiles/ana.jpg"
 *                     isRegistered: false
 *                   - childId: "2abc1234-12ab-34cd-56ef-123456789012"
 *                     childName: "Carlos Pereira"
 *                     profilePictureURL: "https://storage.example.com/profiles/carlos.jpg"
 *                     isRegistered: false
 *               emptyList:
 *                 summary: Parent has no children
 *                 value: []
 *       401:
 *         description: Authentication required - must be logged in as a parent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access token required"
 *       403:
 *         description: Forbidden - only parents can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied. Required role: parent"
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
 * /activity-session/child/{id}:
 *   post:
 *     summary: Add child to an activity session
 *     description: Adds a child to a specific activity session. Parent can only add their own children.
 *     tags:
 *       - Activity Session - Children
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
 *               - childId
 *               - pickUpStationId
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *               pickUpStationId:
 *                 type: string
 *                 example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                 description: "Station ID where the child will be picked up/dropped off"
 *           example:
 *             childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *             pickUpStationId: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *     responses:
 *       201:
 *         description: Child successfully added to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child added to activity session successfully"
 *       400:
 *         description: Child already registered for this activity session or station not assigned to activity
 *       403:
 *         description: Not authorized to add this child
 *       404:
 *         description: Activity session or child not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /activity-session/child/{id}:
 *   delete:
 *     summary: Remove child from an activity session
 *     description: Removes a child from a specific activity session. Parent can only remove their own children.
 *     tags:
 *       - Activity Session - Children
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
 *               - childId
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       200:
 *         description: Child successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child removed from activity session successfully"
 *       400:
 *         description: Child not registered for this activity session
 *       403:
 *         description: Not authorized to remove this child
 *       404:
 *         description: Activity session or child not found
 *       500:
 *         description: Internal server error
 */
