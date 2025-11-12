/**
 * @swagger
 * /activity-session/route/{id}:
 *   get:
 *     summary: Get route info for an activity session
 *     description: Returns route information for the activity session, including stops and connector route if applicable
 *     tags:
 *       - Activity Session - Routes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity session ID
 *     responses:
 *       200:
 *         description: Route info found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 activitySessionId:
 *                   type: string
 *                   example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *                   description: "The activity session ID"
 *                 name:
 *                   type: string
 *                   example: "Rota Pedibus Centro"
 *                 color:
 *                   type: string
 *                   example: "red"
 *                 activityType:
 *                   type: string
 *                   enum: [pedibus, ciclo_expresso]
 *                   example: "pedibus"
 *                 scheduledAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T08:00:00.000Z"
 *                   description: "Scheduled start time for this activity session"
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
 *                       scheduledTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-20T08:00:00.000Z"
 *                         description: "Calculated scheduled time for this station based on activity start time"
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
 *                         activitySessionId:
 *                           type: string
 *                           example: "transfer-session-uuid"
 *                           description: "Activity session ID for the connector route"
 *                         name:
 *                           type: string
 *                           example: "Rota Pedibus Sul"
 *                         color:
 *                           type: string
 *                           example: "blue"
 *                         activityType:
 *                           type: string
 *                           enum: [pedibus, ciclo_expresso]
 *                         scheduledAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-20T08:30:00.000Z"
 *                           description: "Scheduled start time for the connector route"
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
 *                               scheduledTime:
 *                                 type: string
 *                                 format: date-time
 *                                 description: "Calculated scheduled time for connector route stations"
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
 *                   activitySessionId: "c56ad528-3522-4557-8b34-a787a50900b7"
 *                   name: "Rota Pedibus Centro"
 *                   color: "red"
 *                   activityType: "pedibus"
 *                   scheduledAt: "2024-01-20T08:00:00.000Z"
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
 *                       scheduledTime: "2024-01-20T08:00:00.000Z",
 *                       distanceFromPreviousStationMeters: 0,
 *                       name: "R. Manuel Ferreira Gomes",
 *                       type: "regular",
 *                       latitude: 41.553404,
 *                       longitude: -8.397567
 *                     },
 *                     {
 *                       stationId: "48c68f50-ged1-524e-cd01-7838793b9896",
 *                       stopNumber: 2,
 *                       scheduledTime: "2024-01-20T08:05:00.000Z",
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
 *                       activitySessionId: "transfer-session-uuid",
 *                       name: "Rota Pedibus Sul",
 *                       color: "blue",
 *                       activityType: "pedibus",
 *                       scheduledAt: "2024-01-20T08:30:00.000Z",
 *                       route: [
 *                         { lat: 41.553890, lon: -8.397123 },
 *                         { lat: 41.554200, lon: -8.396800 }
 *                       ],
 *                       stops: [
 *                         {
 *                           stationId: "59d79f61-hfe2-635f-de12-8949894c0907",
 *                           stopNumber: 2,
 *                           scheduledTime: "2024-01-20T08:36:00.000Z",
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
 *                   activitySessionId: "c56ad528-3522-4557-8b34-a787a50900b7"
 *                   name: "Rota Pedibus Centro"
 *                   color: "red"
 *                   activityType: "pedibus"
 *                   scheduledAt: "2024-01-20T08:00:00.000Z"
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
 *                       scheduledTime: "2024-01-20T08:00:00.000Z",
 *                       distanceFromPreviousStationMeters: 0,
 *                       name: "R. Manuel Ferreira Gomes",
 *                       type: "regular",
 *                       latitude: 41.553404,
 *                       longitude: -8.397567
 *                     },
 *                     {
 *                       stationId: "48c68f50-ged1-524e-cd01-7838793b9896",
 *                       stopNumber: 2,
 *                       scheduledTime: "2024-01-20T08:05:00.000Z",
 *                       distanceFromPreviousStationMeters: 500,
 *                       name: "Escola Primária",
 *                       type: "school", 
 *                       latitude: 41.553890,
 *                       longitude: -8.397123
 *                     }
 *                   ]
 *                   connector: undefined
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session not found"
 *               route_not_found:
 *                 value:
 *                   message: "Route not found"
 */
