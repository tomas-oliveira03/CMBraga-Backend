/**
 * @swagger
 * /route:
 *   get:
 *     summary: Get all routes
 *     description: Returns a list of all routes with their station count
 *     tags:
 *       - Route
 *     responses:
 *       200:
 *         description: List of routes
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
 *                     example: "Rota Pedibus Centro"
 *                   activityType:
 *                     type: string
 *                     enum: [pedibus, ciclo_expresso]
 *                     example: "pedibus"
 *                   distanceMeters:
 *                     type: integer
 *                     example: 2500
 *                     description: "Total route distance in meters"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   numberOfStations:
 *                     type: integer
 *                     example: 5
 *                     description: "Number of stations in the route"
 */


/**
 * @swagger
 * /route/{id}:
 *   get:
 *     summary: Get route by ID
 *     description: Returns a single route by its ID with station info and bounds object
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     responses:
 *       200:
 *         description: Route found
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
 *                   example: "Rota Pedibus Centro"
 *                 activityType:
 *                   type: string
 *                   enum: [pedibus, ciclo_expresso]
 *                   example: "pedibus"
 *                 distanceMeters:
 *                   type: integer
 *                   example: 2500
 *                   description: "Total route distance in meters"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: null
 *                 route:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                         example: 41.553404
 *                       lon:
 *                         type: number
 *                         example: -8.397567
 *                   description: "Raw route metadata (array of lat/lon points)"
 *                 bounds:
 *                   type: object
 *                   properties:
 *                     north:
 *                       type: number
 *                       example: 41.554448
 *                     east:
 *                       type: number
 *                       example: -8.395174
 *                     south:
 *                       type: number
 *                       example: 41.542617
 *                     west:
 *                       type: number
 *                       example: -8.404334
 *                   description: "Bounding box of the route"
 *                 stops:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stationId:
 *                         type: string
 *                         example: "37b57f49-fecf-413d-bc90-6727682a8785"
 *                       stopNumber:
 *                         type: integer
 *                         example: 1
 *                       distanceFromStartMeters:
 *                         type: integer
 *                         example: 0
 *                       timeFromStartMinutes:
 *                         type: integer
 *                         example: 0
 *                       distanceFromPreviousStationMeters:
 *                         type: integer
 *                         example: 0
 *                       name:
 *                         type: string
 *                         example: "R. Manuel Ferreira Gomes"
 *                       type:
 *                         type: string
 *                         enum: [regular, school]
 *                         example: "regular"
 *                       latitude:
 *                         type: number
 *                         example: 41.553404
 *                       longitude:
 *                         type: number
 *                         example: -8.397567
 *                   description: "List of stops with station info flattened"
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
 */


/**
 * @swagger
 * /route:
 *   post:
 *     summary: Create a new route from KML file
 *     description: Creates a new route by processing a KML file (a.kml). Automatically creates stations and route-station relationships. The KML file should contain a LineString for the route path and Placemarks for stations. All distances are stored in meters (integers).
 *     tags:
 *       - Route
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - activityType
 *               - file
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Rota Pedibus Norte"
 *                 description: "Unique name for the route"
 *               activityType:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *                 description: "Type of activity for this route"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "KML file containing route and station data"
 *     responses:
 *       201:
 *         description: Route created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 stops:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "station-uuid-1"
 *                       name:
 *                         type: string
 *                         example: "Estação Central"
 *                       stopNumber:
 *                         type: integer
 *                         example: 1
 *                       typeofStation:
 *                         type: string
 *                         enum: [regular, school]
 *                         example: "school"
 *                       expectedTimeOfArrivalFromStartMinutes:
 *                         type: integer
 *                         example: 5
 *       400:
 *         description: Validation error or missing/invalid file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "KML file is required"
 *       404:
 *         description: Route name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route name already exists"
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
 * /route/initial-update/{id}:
 *   put:
 *     summary: Initial update for route stations and times
 *     description: Updates station types and time from start for each station in a route. Should be called immediately after route creation to finalize station data.
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - stationId
 *                 - type
 *                 - timeFromStartMinutes
 *               properties:
 *                 stationId:
 *                   type: string
 *                   example: "37b57f49-fecf-413d-bc90-6727682a8785"
 *                 type:
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 timeFromStartMinutes:
 *                   type: integer
 *                   example: 5
 *     responses:
 *       200:
 *         description: Route updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
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
 * /route/{id}:
 *   put:
 *     summary: Update route by ID
 *     description: Updates the route's information by its ID. Only name and activityType can be updated.
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Rota Pedibus Centro"
 *               activityType:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *     responses:
 *       200:
 *         description: Route updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
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
 * /route/possible-transfers/{id}:
 *   get:
 *     summary: Get all possible transfer routes and stops for a route
 *     description: Returns a list of all routes that share at least one station with the given route, and for each route, the list of shared stops (station id and name).
 *     tags:
 *       - Route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Route ID (UUID)
 *     responses:
 *       200:
 *         description: List of possible transfer routes and stops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                   name:
 *                     type: string
 *                     example: "Rota Ciclo Expresso Norte"
 *                   stops:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "station-uuid-1"
 *                         name:
 *                           type: string
 *                           example: "Estação Central"
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route not found"
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
