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
 *                   color:
 *                     type: string
 *                     enum: [red, blue, green, yellow, orange, purple, pink, brown]
 *                     example: "red"
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
 *     description: Returns a single route by its ID with station info, bounds object, and optional connector info
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
 *                 color:
 *                   type: string
 *                   enum: [red, blue, green, yellow, orange, purple, pink, brown]
 *                   example: "red"  
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
 *                   nullable: true
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
 *                 bounds:
 *                   type: object
 *                   properties:
 *                     north:
 *                       type: number
 *                       example: 41.554448
 *                       description: "Northern boundary coordinate"
 *                     east:
 *                       type: number
 *                       example: -8.395174
 *                       description: "Eastern boundary coordinate"
 *                     south:
 *                       type: number
 *                       example: 41.542617
 *                       description: "Southern boundary coordinate"
 *                     west:
 *                       type: number
 *                       example: -8.404334
 *                       description: "Western boundary coordinate"
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
 *                 connector:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     connectorStation:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "station-uuid-1"
 *                         name:
 *                           type: string
 *                           example: "Estação Central"
 *                     connectorRoute:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "route-uuid-2"
 *                         name:
 *                           type: string
 *                           example: "Rota Pedibus Sul"
 *                         color:
 *                           type: string
 *                           enum: [red, blue, green, yellow, orange, purple, pink, brown]
 *                           example: "blue"
 *                         activityType:
 *                           type: string
 *                           enum: [pedibus, ciclo_expresso]
 *                         distanceMeters:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         route:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               lat:
 *                                 type: number
 *                               lon:
 *                                 type: number
 *                         stops:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               stationId:
 *                                 type: string
 *                               stopNumber:
 *                                 type: integer
 *                               distanceFromStartMeters:
 *                                 type: integer
 *                               timeFromStartMinutes:
 *                                 type: integer
 *                               distanceFromPreviousStationMeters:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                                 enum: [regular, school]
 *                               latitude:
 *                                 type: number
 *                               longitude:
 *                                 type: number
 *             examples:
 *               withConnector:
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   name: "Rota Pedibus Centro"
 *                   color: "red"
 *                   activityType: "pedibus"
 *                   distanceMeters: 2500
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: null
 *                   route: [
 *                     { lat: 41.553404, lon: -8.397567 },
 *                     { lat: 41.553890, lon: -8.397123 }
 *                   ]
 *                   bounds: {
 *                     north: 41.554448,
 *                     east: -8.395174,
 *                     south: 41.542617,
 *                     west: -8.404334
 *                   }
 *                   stops: [
 *                     {
 *                       stationId: "37b57f49-fecf-413d-bc90-6727682a8785",
 *                       stopNumber: 1,
 *                       distanceFromStartMeters: 0,
 *                       timeFromStartMinutes: 0,
 *                       distanceFromPreviousStationMeters: 0,
 *                       name: "R. Manuel Ferreira Gomes",
 *                       type: "regular",
 *                       latitude: 41.553404,
 *                       longitude: -8.397567
 *                     },
 *                     {
 *                       stationId: "48c68f50-ged1-524e-cd01-7838793b9896",
 *                       stopNumber: 2,
 *                       distanceFromStartMeters: 500,
 *                       timeFromStartMinutes: 5,
 *                       distanceFromPreviousStationMeters: 500,
 *                       name: "Escola Primária",
 *                       type: "school",
 *                       latitude: 41.553890,
 *                       longitude: -8.397123
 *                     }
 *                   ]
 *                   connector: {
 *                     connectorStation: {
 *                       id: "48c68f50-ged1-524e-cd01-7838793b9896",
 *                       name: "Escola Primária"
 *                     },
 *                     connectorRoute: {
 *                       id: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
 *                       name: "Rota Pedibus Sul",
 *                       color: "blue",
 *                       activityType: "pedibus",
 *                       distanceMeters: 3000,
 *                       createdAt: "2024-01-15T10:35:00.000Z",
 *                       updatedAt: null,
 *                       route: [
 *                         { lat: 41.553890, lon: -8.397123 },
 *                         { lat: 41.554200, lon: -8.396800 }
 *                       ],
 *                       stops: [
 *                         {
 *                           stationId: "59d79f61-hfe2-635f-de12-8949894c0907",
 *                           stopNumber: 2,
 *                           distanceFromStartMeters: 600,
 *                           timeFromStartMinutes: 6,
 *                           distanceFromPreviousStationMeters: 600,
 *                           name: "Praça Municipal",
 *                           type: "regular",
 *                           latitude: 41.554200,
 *                           longitude: -8.396800
 *                         }
 *                       ]
 *                     }
 *                   }
 *               withoutConnector:
 *                 value:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   name: "Rota Pedibus Centro"
 *                   color: "red"
 *                   activityType: "pedibus"
 *                   distanceMeters: 2500
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: null
 *                   route: [
 *                     { lat: 41.553404, lon: -8.397567 },
 *                     { lat: 41.553890, lon: -8.397123 }
 *                   ]
 *                   bounds: {
 *                     north: 41.554448,
 *                     east: -8.395174,
 *                     south: 41.542617,
 *                     west: -8.404334
 *                   }
 *                   stops: [
 *                     {
 *                       stationId: "37b57f49-fecf-413d-bc90-6727682a8785",
 *                       stopNumber: 1,
 *                       distanceFromStartMeters: 0,
 *                       timeFromStartMinutes: 0,
 *                       distanceFromPreviousStationMeters: 0,
 *                       name: "R. Manuel Ferreira Gomes",
 *                       type: "regular",
 *                       latitude: 41.553404,
 *                       longitude: -8.397567
 *                     },
 *                     {
 *                       stationId: "48c68f50-ged1-524e-cd01-7838793b9896",
 *                       stopNumber: 2,
 *                       distanceFromStartMeters: 500,
 *                       timeFromStartMinutes: 5,
 *                       distanceFromPreviousStationMeters: 500,
 *                       name: "Escola Primária",
 *                       type: "school", 
 *                       latitude: 41.553890,
 *                       longitude: -8.397123
 *                     }
 *                   ]
 *                   connector: undefined
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
 *               - color
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
 *               color:
 *                 type: string
 *                 enum: [red, blue, green, yellow, orange, purple, pink, brown]
 *                 example: "red"
 *                 description: "Color of the route"
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
 *               color:
 *                 type: string
 *                 enum: [red, blue, green, yellow, orange, purple, pink, brown]
 *                 example: "blue"
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
