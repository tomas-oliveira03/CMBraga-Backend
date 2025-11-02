/**
 * @swagger
 * /child:
 *   get:
 *     summary: Get all children
 *     description: Returns a list of all children
 *     tags:
 *       - Child
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
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                     example: "male"
 *                   school:
 *                     type: string
 *                     example: "Escola Básica de Braga"
 *                   schoolGrade:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 12
 *                     example: 4
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
 *                   dropOffStationId:
 *                     type: string
 *                     example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                     description: "School station ID where the child is dropped off"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/child-1.jpg"
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
 * /child/{id}:
 *   get:
 *     summary: Get child by ID
 *     description: Returns a single child by their ID
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
 *                 gender:
 *                   type: string
 *                   enum: [male, female]
 *                   example: "female"
 *                 school:
 *                   type: string
 *                   example: "Escola Básica de Braga"
 *                 schoolGrade:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 12
 *                   example: 3
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
 *                 dropOffStationId:
 *                   type: string
 *                   example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                   description: "School station ID where the child is dropped off"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/child-2.jpg"
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
 *     description: Returns a list of upcoming activity sessions that the child can register for, including connector information if applicable.
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
 *         description: List of available activities for registration
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   mode:
 *                     type: string
 *                   inLateRegistration:
 *                     type: boolean
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                   route:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                   requiresConnector:
 *                     type: boolean
 *                   connector:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       route:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                       station:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
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
