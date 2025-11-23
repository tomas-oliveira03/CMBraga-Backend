/**
 * @swagger
 * /child:
 *   get:
 *     summary: Get all children (Admin only)
 *     description: Returns a list of all children. Requires admin authentication.
 *     tags:
 *       - Child
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children
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
 *                     example: "João Silva"
 *                   profilePictureURL:
 *                     type: string
 *                     nullable: true
 *                     example: "https://storage.example.com/profiles/child-1.jpg"
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                     example: "male"
 *                   heightCentimeters:
 *                     type: number
 *                     nullable: true
 *                     example: 140
 *                   weightKilograms:
 *                     type: number
 *                     nullable: true
 *                     example: 35
 *                   cortisolLevel:
 *                     type: integer
 *                     nullable: true
 *                     example: 15
 *                     description: "Child's cortisol level measurement"
 *                   school:
 *                     type: string
 *                     example: "Escola Básica de Braga"
 *                   schoolGrade:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 12
 *                     example: 4
 *                   dropOffStation:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                       name:
 *                         type: string
 *                         example: "Escola Básica de Braga"
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                     example: "2015-05-20"
 *                   healthProblems:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       allergies:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["peanuts", "lactose"]
 *                       chronicDiseases:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["asthma"]
 *                       surgeries:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                             year:
 *                               type: number
 *                         example: [{"type": "appendectomy", "year": 2020}]
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
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: Insufficient permissions"
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
 * /child/{id}:
 *   get:
 *     summary: Get child by ID
 *     description: Returns a single child by their ID. Admins can access any child, parents can only access their associated children.
 *     tags:
 *       - Child
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: Child found
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
 *                   example: "Maria Santos"
 *                 profilePictureURL:
 *                   type: string
 *                   nullable: true
 *                   example: "https://storage.example.com/profiles/child-2.jpg"
 *                 gender:
 *                   type: string
 *                   enum: [male, female]
 *                   example: "female"
 *                 heightCentimeters:
 *                   type: number
 *                   nullable: true
 *                   example: 135
 *                 weightKilograms:
 *                   type: number
 *                   nullable: true
 *                   example: 32
 *                 cortisolLevel:
 *                   type: integer
 *                   nullable: true
 *                   example: 12
 *                   description: "Child's cortisol level measurement"
 *                 school:
 *                   type: string
 *                   example: "Escola Básica de Braga"
 *                 schoolGrade:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 12
 *                   example: 3
 *                 dropOffStation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                     name:
 *                       type: string
 *                       example: "Escola Básica de Braga"
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                   example: "2016-03-10"
 *                 healthProblems:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     allergies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     chronicDiseases:
 *                       type: array
 *                       items:
 *                         type: string
 *                     surgeries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           year:
 *                             type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       403:
 *         description: Forbidden - You do not have access to this child's information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You do not have access to this child's information."
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
 *                   example: "Internal server error"
 */


/**
 * @swagger
 * /child/{id}:
 *   put:
 *     summary: Update a child
 *     description: Updates an existing child and records height/weight changes in history. Can add one additional parent (max 2 parents total) or remove a parent (with validations).
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
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
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "male"
 *               school:
 *                 type: string
 *                 example: "Escola Secundária de Braga"
 *               schoolGrade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 6
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2015-11-30"
 *               healthProblems:
 *                 type: string
 *                 description: "JSON string of health problems object"
 *                 example: '{"allergies":["gluten","shellfish"],"chronicDiseases":[],"surgeries":[]}'

 *               heightCentimeters:
 *                 type: number
 *                 example: 135
 *                 description: "Child's height in centimeters (records history if provided)"
 *               weightKilograms:
 *                 type: number
 *                 example: 32
 *                 description: "Child's weight in kilograms (records history if provided)"
 *               cortisolLevel:
 *                 type: integer
 *                 example: 18
 *                 description: "Child's cortisol level measurement"
 *               dropOffStationId:
 *                 type: string
 *                 example: "station-uuid-2"
 *                 description: "School station ID where the child will be dropped off"
 *               parentId:
 *                 type: string
 *                 description: "Parent ID to add (max 2 parents total)"
 *                 example: "parent-uuid-2"
 *               removeParentId:
 *                 type: string
 *                 description: "Parent ID to remove (requires at least 1 other parent, no activities, no feedback)"
 *                 example: "parent-uuid-1"
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
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "male"
 *               school:
 *                 type: string
 *                 example: "Escola Secundária de Braga"
 *               schoolGrade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 6
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2015-11-30"
 *               healthProblems:
 *                 type: object
 *                 nullable: true
 *               heightCentimeters:
 *                 type: number
 *                 example: 135
 *               weightKilograms:
 *                 type: number
 *                 example: 32
 *               cortisolLevel:
 *                 type: integer
 *                 example: 18
 *               dropOffStationId:
 *                 type: string
 *                 example: "station-uuid-2"
 *               parentId:
 *                 type: string
 *                 example: "parent-uuid-2"
 *               removeParentId:
 *                 type: string
 *                 example: "parent-uuid-1"
 *           example:
 *             removeParentId: "parent-uuid-1"
 *     responses:
 *       200:
 *         description: Child updated successfully
 *       400:
 *         description: Validation error or cannot remove parent (only parent, has activities, or has feedback)
 *       404:
 *         description: Child not found or parent not associated
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /child/available-activities/{id}:
 *   get:
 *     summary: Get available activities for a child
 *     description: Returns a list of upcoming activity sessions that the child can register for, including available pickup stations for each activity and the child's drop-off station information.
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: Available activities with pickup stations and child's drop-off station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "activity-session-uuid-1"
 *                       type:
 *                         type: string
 *                         enum: [pedibus, ciclo_expresso]
 *                         example: "ciclo_expresso"
 *                       mode:
 *                         type: string
 *                         enum: [walk, bike]
 *                         example: "bike"
 *                       inLateRegistration:
 *                         type: boolean
 *                         example: false
 *                       scheduledAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-20T08:00:00.000Z"
 *                       route:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "route-uuid-1"
 *                           name:
 *                             type: string
 *                             example: "Linha Azul"
 *                       requiresConnector:
 *                         type: boolean
 *                         example: false
 *                         description: "True if this activity requires a transfer to another route"
 *                       connector:
 *                         type: object
 *                         nullable: true
 *                         description: "Present only when requiresConnector is true"
 *                         properties:
 *                           route:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "route-uuid-2"
 *                               name:
 *                                 type: string
 *                                 example: "Linha Vermelha"
 *                           station:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "station-uuid-transfer"
 *                               name:
 *                                 type: string
 *                                 example: "Av. 31 de Janeiro"
 *                       availablePickupStations:
 *                         type: array
 *                         description: "Stations where the child can be picked up (before drop-off or connector station)"
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "station-uuid-pickup"
 *                             name:
 *                               type: string
 *                               example: "Estação Central"
 *                 dropOffStation:
 *                   type: object
 *                   description: "Child's designated drop-off station (school)"
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "station-uuid-school"
 *                     name:
 *                       type: string
 *                       example: "Escola Básica de Braga"
 *             examples:
 *               activities_with_and_without_connector:
 *                 summary: Mix of activities with and without connector
 *                 value:
 *                   activities:
 *                     - id: "activity-session-uuid-1"
 *                       type: "ciclo_expresso"
 *                       mode: "bike"
 *                       inLateRegistration: false
 *                       scheduledAt: "2024-01-20T08:00:00.000Z"
 *                       route:
 *                         id: "route-uuid-1"
 *                         name: "Linha Azul"
 *                       requiresConnector: false
 *                       connector: null
 *                       availablePickupStations:
 *                         - id: "station-uuid-1"
 *                           name: "Estação Central"
 *                         - id: "station-uuid-2"
 *                           name: "Biblioteca Municipal"
 *                     - id: "activity-session-uuid-2"
 *                       type: "ciclo_expresso"
 *                       mode: "bike"
 *                       inLateRegistration: false
 *                       scheduledAt: "2024-01-21T08:00:00.000Z"
 *                       route:
 *                         id: "route-uuid-1"
 *                         name: "Linha Azul"
 *                       requiresConnector: true
 *                       connector:
 *                         route:
 *                           id: "route-uuid-2"
 *                           name: "Linha Vermelha"
 *                         station:
 *                           id: "station-uuid-transfer"
 *                           name: "Av. 31 de Janeiro"
 *                       availablePickupStations:
 *                         - id: "station-uuid-1"
 *                           name: "Estação Central"
 *                   dropOffStation:
 *                     id: "station-uuid-school"
 *                     name: "Escola Básica de Braga"
 *               no_activities_available:
 *                 summary: No activities available for registration
 *                 value:
 *                   activities: []
 *                   dropOffStation:
 *                     id: "station-uuid-school"
 *                     name: "Escola Básica de Braga"
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
 *                   example: "Internal server error"
 */


/**
 * @swagger
 * /child/upcoming-activities/{id}:
 *   get:
 *     summary: Get upcoming activities for a child
 *     description: Returns a list of upcoming activity sessions for a child, grouped by chained activities (bundles) or as singles.
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of upcoming activities grouped by bundle or single
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [single]
 *                       activitySessionId:
 *                         type: string
 *                       isLateRegistration:
 *                         type: boolean
 *                       registeredAt:
 *                         type: string
 *                         format: date-time
 *                       activitySession:
 *                         type: object
 *                         properties:
 *                           type: { type: string }
 *                           mode: { type: string }
 *                           scheduledAt: { type: string, format: date-time }
 *                           expectedDepartureAt: { type: string, format: date-time }
 *                           expectedArrivalAt: { type: string, format: date-time }
 *                       route:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       pickUpStation:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       dropOffStation:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       registeredBy:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       isParentRegistered:
 *                         type: boolean
 *                         description: "Whether the requesting parent is also registered for this activity session"
 *                       chainedInfo:
 *                         type: string
 *                         nullable: true
 *                   - type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [bundle]
 *                       activities:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             activitySessionId: { type: string }
 *                             isLateRegistration: { type: boolean }
 *                             registeredAt: { type: string, format: date-time }
 *                             activitySession:
 *                               type: object
 *                               properties:
 *                                 type: { type: string }
 *                                 mode: { type: string }
 *                                 scheduledAt: { type: string, format: date-time }
 *                                 expectedDepartureAt: { type: string, format: date-time }
 *                                 expectedArrivalAt: { type: string, format: date-time }
 *                             route:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             pickUpStation:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             dropOffStation:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             registeredBy:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             isParentRegistered:
 *                               type: boolean
 *                               description: "Whether the requesting parent is also registered for this activity session"
 *                             chainedInfo:
 *                               type: string
 *                               nullable: true
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
 * /child/ongoing-activities/{id}:
 *   get:
 *     summary: Get ongoing activities for a child
 *     description: Returns a list of ongoing activity sessions for a child, grouped by chained activities (bundles) or as singles.
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of ongoing activities grouped by bundle or single
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - type: object
 *                     properties:
 *                       type: { type: string, enum: [single] }
 *                       activitySessionId: { type: string }
 *                       isLateRegistration: { type: boolean }
 *                       registeredAt: { type: string, format: date-time }
 *                       activitySession:
 *                         type: object
 *                         properties:
 *                           type: { type: string }
 *                           mode: { type: string }
 *                           startedAt: { type: string, format: date-time }
 *                           expectedDepartureAt: { type: string, format: date-time }
 *                           departuredAt: { type: string, format: date-time, nullable: true }
 *                           expectedArrivalAt: { type: string, format: date-time }
 *                           arrivedAt: { type: string, format: date-time, nullable: true }
 *                           weatherTemperature: { type: number, nullable: true }
 *                           weatherType: { type: string, nullable: true }
 *                       route:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       pickUpStation:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       dropOffStation:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       registeredBy:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       chainedInfo:
 *                         type: string
 *                         nullable: true
 *                   - type: object
 *                     properties:
 *                       type: { type: string, enum: [bundle] }
 *                       activities:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             activitySessionId: { type: string }
 *                             isLateRegistration: { type: boolean }
 *                             registeredAt: { type: string, format: date-time }
 *                             activitySession:
 *                               type: object
 *                               properties:
 *                                 type: { type: string }
 *                                 mode: { type: string }
 *                                 startedAt: { type: string, format: date-time }
 *                                 expectedDepartureAt: { type: string, format: date-time }
 *                                 departuredAt: { type: string, format: date-time, nullable: true }
 *                                 expectedArrivalAt: { type: string, format: date-time }
 *                                 arrivedAt: { type: string, format: date-time, nullable: true }
 *                                 weatherTemperature: { type: number, nullable: true }
 *                                 weatherType: { type: string, nullable: true }
 *                             route:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             pickUpStation:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             dropOffStation:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             registeredBy:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             chainedInfo:
 *                               type: string
 *                               nullable: true
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
 * /child/previous-activities/{id}:
 *   get:
 *     summary: Get previous activities for a child
 *     description: Returns a list of previous activity sessions for a child, grouped by chained activities (bundles) or as singles.
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of previous activities grouped by bundle or single
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [single]
 *                       activitySessionId:
 *                         type: string
 *                       isLateRegistration:
 *                         type: boolean
 *                       registeredAt:
 *                         type: string
 *                         format: date-time
 *                       activitySession:
 *                         type: object
 *                         properties:
 *                           type: { type: string }
 *                           mode: { type: string }
 *                           startedAt: { type: string, format: date-time }
 *                           departuredAt: { type: string, format: date-time }
 *                           arrivedAt: { type: string, format: date-time }
 *                           finishedAt: { type: string, format: date-time }
 *                           weatherTemperature: { type: number, nullable: true }
 *                           weatherType: { type: string, nullable: true }
 *                       route:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       pickUpStation:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       dropOffStation:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       registeredBy:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       stats:
 *                         type: object
 *                         properties:
 *                           distanceMeters: { type: number, nullable: true }
 *                           co2Saved: { type: number, nullable: true }
 *                           caloriesBurned: { type: number, nullable: true }
 *                           pointsEarned: { type: number, nullable: true }
 *                       chainedInfo:
 *                         type: string
 *                         nullable: true
 *                   - type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [bundle]
 *                       activities:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             activitySessionId: { type: string }
 *                             isLateRegistration: { type: boolean }
 *                             registeredAt: { type: string, format: date-time }
 *                             activitySession:
 *                               type: object
 *                               properties:
 *                                 type: { type: string }
 *                                 mode: { type: string }
 *                                 startedAt: { type: string, format: date-time }
 *                                 departuredAt: { type: string, format: date-time }
 *                                 arrivedAt: { type: string, format: date-time }
 *                                 finishedAt: { type: string, format: date-time }
 *                                 weatherTemperature: { type: number, nullable: true }
 *                                 weatherType: { type: string, nullable: true }
 *                             route:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             pickUpStation:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             dropOffStation:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             registeredBy:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                             chainedInfo:
 *                               type: string
 *                               nullable: true
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
 * /child/history/{id}:
 *   get:
 *     summary: Get child's health history
 *     description: Returns the health history records for a specific child, including height, weight, cortisol level measurements over time. Admins and health professionals can access any child's history, parents can only access their associated children's history.
 *     tags:
 *       - Child
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: Child health history records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "h1s2t3o4-r5y6-7890-abcd-ef1234567890"
 *                     description: "History record ID"
 *                   heightCentimeters:
 *                     type: number
 *                     example: 140.5
 *                     description: "Child's height in centimeters at time of record"
 *                   weightKilograms:
 *                     type: number
 *                     example: 35.2
 *                     description: "Child's weight in kilograms at time of record"
 *                   cortisolLevel:
 *                     type: integer
 *                     example: 15
 *                     description: "Child's cortisol level measurement at time of record"
 *                   age:
 *                     type: integer
 *                     example: 9
 *                     description: "Child's age in years when this record was created"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                     description: "When this health record was created"
 *             examples:
 *               multiple_records:
 *                 summary: Child with multiple health history records
 *                 value:
 *                   - id: "h1s2t3o4-r5y6-7890-abcd-ef1234567890"
 *                     heightCentimeters: 135.0
 *                     weightKilograms: 32.5
 *                     cortisolLevel: 12
 *                     age: 8
 *                     createdAt: "2023-09-15T09:00:00.000Z"
 *                   - id: "h2s3t4o5-r6y7-8901-bcde-ef2345678901"
 *                     heightCentimeters: 140.5
 *                     weightKilograms: 35.2
 *                     cortisolLevel: 15
 *                     age: 9
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                   - id: "h3s4t5o6-r7y8-9012-cdef-ef3456789012"
 *                     heightCentimeters: 144.0
 *                     weightKilograms: 37.8
 *                     cortisolLevel: 14
 *                     age: 9
 *                     createdAt: "2024-03-20T14:15:00.000Z"
 *               no_history:
 *                 summary: Child with no health history records
 *                 value: []
 *               single_record:
 *                 summary: Child with single health history record
 *                 value:
 *                   - id: "h1s2t3o4-r5y6-7890-abcd-ef1234567890"
 *                     heightCentimeters: 140.5
 *                     weightKilograms: 35.2
 *                     cortisolLevel: 15
 *                     age: 9
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       403:
 *         description: Forbidden - You do not have access to this child's information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You do not have access to this child's information."
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
 *                   example: "Internal server error"
 */
