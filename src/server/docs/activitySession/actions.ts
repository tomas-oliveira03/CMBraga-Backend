/**
 * @swagger
 * /activity-session/actions/start:
 *   post:
 *     summary: Start an activity session
 *     description: Allows an instructor to start an activity session within 30 minutes before the scheduled time.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Activity started successfully with first station info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: 
 *                   type: string
 *                   example: "station-uuid-1"
 *                 name: 
 *                   type: string
 *                   example: "Escola Primária Central"
 *                 type: 
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "school"
 *                 latitude:
 *                   type: number
 *                   example: 41.5454
 *                   description: "Station latitude coordinate"
 *                 longitude:
 *                   type: number
 *                   example: -8.4265
 *                   description: "Station longitude coordinate"
 *             examples:
 *               success:
 *                 value:
 *                   id: "station-uuid-1"
 *                   name: "Escola Primária Central"
 *                   type: "school"
 *                   latitude: 41.5454
 *                   longitude: -8.4265
 *       400:
 *         description: Bad request or already started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_id:
 *                 value:
 *                   message: "Activity session ID is required"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *               already_started:
 *                 value:
 *                   message: "Activity session already started"
 *               too_early:
 *                 value:
 *                   message: "Cannot start activity: must be within 30 minutes of scheduled time"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found"
 *               first_station_not_found:
 *                 value:
 *                   message: "First station not found"
 */


/**
 * @swagger
 * /activity-session/actions/end:
 *   post:
 *     summary: End an activity session
 *     description: Allows an instructor to end an activity session if all children have checked out and all stations are completed.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Activity finished successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Activity finished successfully"
 *       400:
 *         description: Cannot finish activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_started:
 *                 value:
 *                   message: "Activity session not started yet"
 *               already_finished:
 *                 value:
 *                   message: "Activity session already finished"
 *               incomplete_checkouts:
 *                 value:
 *                   message: "Cannot finish activity: some children have incomplete check-out records"
 *               stations_in_progress:
 *                 value:
 *                   message: "Cannot finish activity: some stations are still in progress"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found"
 */


/**
 * @swagger
 * /activity-session/actions/station/pick-up:
 *   get:
 *     summary: Get children to pick up at current and upcoming stations
 *     description: Returns children to be picked up at the current and upcoming stations for the ongoing activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Children to pick up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 childrenToPickUp:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-1" }
 *                       name: { type: string, example: "João Silva" }
 *                 upcomingStationChildrenToPickUp:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-2" }
 *                       name: { type: string, example: "Maria Santos" }
 *             examples:
 *               example:
 *                 value:
 *                   childrenToPickUp:
 *                     - id: "child-uuid-1"
 *                       name: "João Silva"
 *                   upcomingStationChildrenToPickUp:
 *                     - id: "child-uuid-2"
 *                       name: "Maria Santos"
 *       404:
 *         description: Activity session not found or no more stations left
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session doesn't exist"
 *               no_stations:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */



/**
 * @swagger
 * /activity-session/actions/station/still-in:
 *   get:
 *     summary: Get children still in the current station
 *     description: Returns children already picked up, to be dropped off, and yet to be dropped off at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Children still in station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allChildrenAlreadyPickedUp:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-1" }
 *                       name: { type: string, example: "João Silva" }
 *                 allChildrenToBeDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-2" }
 *                       name: { type: string, example: "Maria Santos" }
 *                 allChildrenYetToBeDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-3" }
 *                       name: { type: string, example: "Ana Costa" }
 *             examples:
 *               example:
 *                 value:
 *                   allChildrenAlreadyPickedUp:
 *                     - id: "child-uuid-1"
 *                       name: "João Silva"
 *                   allChildrenToBeDroppedOff:
 *                     - id: "child-uuid-2"
 *                       name: "Maria Santos"
 *                   allChildrenYetToBeDroppedOff:
 *                     - id: "child-uuid-3"
 *                       name: "Ana Costa"
 *       404:
 *         description: Activity session not found or no more stations left
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */



/**
 * @swagger
 * /activity-session/actions/station/drop-off:
 *   get:
 *     summary: Get children to drop off at current station
 *     description: Returns children to be dropped off and already dropped off at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Children to drop off
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allChildrenDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-1" }
 *                       name: { type: string, example: "João Silva" }
 *                 allChildrenPreviouslyDroppedOff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "child-uuid-2" }
 *                       name: { type: string, example: "Maria Santos" }
 *             examples:
 *               example:
 *                 value:
 *                   allChildrenDroppedOff:
 *                     - id: "child-uuid-1"
 *                       name: "João Silva"
 *                   allChildrenPreviouslyDroppedOff:
 *                     - id: "child-uuid-2"
 *                       name: "Maria Santos"
 *       404:
 *         description: Activity session not found or no more stations left
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */


/**
 * @swagger
 * /activity-session/actions/station/next-stop:
 *   post:
 *     summary: Move to the next station
 *     description: Marks the current station as completed and returns the next station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Next station info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: 
 *                   type: string
 *                   example: "station-uuid-2"
 *                 name: 
 *                   type: string
 *                   example: "Biblioteca Central"
 *                 type: 
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 latitude:
 *                   type: number
 *                   example: 41.5454
 *                   description: "Station latitude coordinate"
 *                 longitude:
 *                   type: number
 *                   example: -8.4265
 *                   description: "Station longitude coordinate"
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-2"
 *                   name: "Biblioteca Central"
 *                   type: "regular"
 *                   latitude: 41.5454
 *                   longitude: -8.4265
 *       402:
 *         description: There are still children to be dropped off or no next station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               children_pending:
 *                 value:
 *                   message: "There are still children to be dropped off at the current station"
 *               no_next_station:
 *                 value:
 *                   message: "There isn't a next station"
 *       404:
 *         description: Next station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_found:
 *                 value:
 *                   message: "Next station not found"
 */


/**
 * @swagger
 * /activity-session/actions/station/arrived-at-stop:
 *   post:
 *     summary: Mark arrival at current station
 *     description: Marks the instructor as arrived at the current station and returns the station info with flags.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Current station info with arrival confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: 
 *                   type: string
 *                   example: "station-uuid-1"
 *                 name: 
 *                   type: string
 *                   example: "Biblioteca Central"
 *                 type: 
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 latitude:
 *                   type: number
 *                   example: 41.5454
 *                   description: "Station latitude coordinate"
 *                 longitude:
 *                   type: number
 *                   example: -8.4265
 *                   description: "Station longitude coordinate"
 *                 isLastStation: 
 *                   type: boolean
 *                   example: false
 *                   description: "Indicates if this is the last station in the route"
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-1"
 *                   name: "Biblioteca Central"
 *                   type: "regular"
 *                   latitude: 41.5454
 *                   longitude: -8.4265
 *                   isLastStation: false
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_id:
 *                 value:
 *                   message: "Activity session ID is required"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
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
 *                   message: "Activity session doesn't exist"
 *               no_stations:
 *                 value:
 *                   message: "No more stations left"
 *               station_not_found:
 *                 value:
 *                   message: "Current station not found"
 */


/**
 * @swagger
 * /activity-session/actions/station/status:
 *   get:
 *     summary: Get current station status
 *     description: Returns the current station and whether it is the last station, or the activity status.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Current station info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: 
 *                   type: string
 *                   example: "station-uuid-1"
 *                 name: 
 *                   type: string
 *                   example: "Estação Central"
 *                 type: 
 *                   type: string
 *                   enum: [regular, school]
 *                   example: "regular"
 *                 latitude:
 *                   type: number
 *                   example: 41.5454
 *                   description: "Station latitude coordinate"
 *                 longitude:
 *                   type: number
 *                   example: -8.4265
 *                   description: "Station longitude coordinate"
 *                 isInStation: 
 *                   type: boolean
 *                   example: true
 *                   description: "Indicates if the instructor has arrived at the station"
 *                 isLastStation: 
 *                   type: boolean
 *                   example: false
 *                   description: "Indicates if this is the last station in the route"
 *             examples:
 *               example:
 *                 value:
 *                   id: "station-uuid-1"
 *                   name: "Estação Central"
 *                   type: "regular"
 *                   latitude: 41.5454
 *                   longitude: -8.4265
 *                   isInStation: true
 *                   isLastStation: false
 *       201:
 *         description: Activity ready to be ended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               ready:
 *                 value:
 *                   message: "Activity ready to be ended"
 *       202:
 *         description: Activity already ended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               ended:
 *                 value:
 *                   message: "Activity already ended"
 *       203:
 *         description: Activity not started yet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_started:
 *                 value:
 *                   message: "Activity not started yet"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_id:
 *                 value:
 *                   message: "Activity session ID is required"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *       404:
 *         description: Current station not found
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
 *                   message: "Activity session doesn't exist"
 *               not_found:
 *                 value:
 *                   message: "Current station not found"
 */



/**
 * @swagger
 * /activity-session/actions/child/check-in:
 *   post:
 *     summary: Check in a child at the current station
 *     description: Checks in a child at the current station for the activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child checked-in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child checked-in successfully"
 *       400:
 *         description: Bad request or already checked-in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
 *               not_registered:
 *                 value:
 *                   message: "Child is not registered for this activity session in this station"
 *               already_checked_in:
 *                 value:
 *                   message: "Child already checked-in"
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
 *               child_not_found:
 *                 value:
 *                   message: "Child not found"
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session not found"
 *               no_stations:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */


/**
 * @swagger
 * /activity-session/actions/child/check-out:
 *   post:
 *     summary: Check out a child at the current station
 *     description: Checks out a child at the current station for the activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child checked-out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child checked-out successfully"
 *       400:
 *         description: Bad request or already checked-out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
 *               not_registered:
 *                 value:
 *                   message: "Child is not registered for this activity session in this station"
 *               already_checked_out:
 *                 value:
 *                   message: "Child already checked-out"
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
 *               child_not_found:
 *                 value:
 *                   message: "Child not found or not at the correct station"
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session not found"
 */



/**
 * @swagger
 * /activity-session/actions/child/check-in:
 *   delete:
 *     summary: Undo check-in for a child at the current station
 *     description: Removes the check-in record for a child at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child unchecked-in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child uncheked-in sucessfully"
 *       400:
 *         description: Child is not checked-in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_checked_in:
 *                 value:
 *                   message: "Child is not checked-in"
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
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
 *               not_found:
 *                 value:
 *                   message: "Child not found"
 */


/**
 * @swagger
 * /activity-session/actions/child/check-out:
 *   delete:
 *     summary: Undo check-out for a child at the current station
 *     description: Removes the check-out record for a child at the current station.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Child unchecked-out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Child unchecked-out successfully"
 *       400:
 *         description: Child not checked-out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_checked_out:
 *                 value:
 *                   message: "Child not checked-out"
 *               missing_params:
 *                 value:
 *                   message: "Child ID, Station ID and Activity Session ID are required"
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
 *               not_found:
 *                 value:
 *                   message: "Child not found or not at the correct station"
 */


/**
 * @swagger
 * /activity-session/actions/child/allActivities:
 *   get:
 *     summary: Get all activities for a child
 *     description: Returns all activity sessions that a specific child is registered for.
 *     tags:
 *       - Activity Session - Actions
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *         example: "child-uuid-1"
 *     responses:
 *       200:
 *         description: List of activity sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "activity-session-uuid-1"
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   finishedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *             examples:
 *               success:
 *                 value:
 *                   - id: "activity-session-uuid-1"
 *                     scheduledAt: "2024-01-15T10:00:00.000Z"
 *                     startedAt: "2024-01-15T10:30:00.000Z"
 *                     finishedAt: null
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_id:
 *                 value:
 *                   message: "Child ID is required"
 */


/**
 * @swagger
 * /activity-session/actions/parent/check-in:
 *   post:
 *     summary: Check in a parent
 *     description: Checks in a parent for the activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent ID
 *         example: "parent-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Parent checked-in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Parent checked-in successfully"
 *       400:
 *         description: Bad request or already checked-in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               missing_params:
 *                 value:
 *                   message: "Parent ID, Station ID and Activity Session ID are required"
 *               not_registered:
 *                 value:
 *                   message: "Parent is not registered for this activity session in this station"
 *               already_checked_in:
 *                 value:
 *                   message: "Parent already checked-in"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
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
 *               parent_not_found:
 *                 value:
 *                   message: "Parent not found"
 *               activity_not_found:
 *                 value:
 *                   message: "Activity session not found"
 *               station_not_found:
 *                 value:
 *                   message: "Station not found in this activity session"
 *               no_stations:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */


/**
 * @swagger
 * /activity-session/actions/parent/check-in:
 *   delete:
 *     summary: Undo check-in for a parent
 *     description: Removes the check-in record for a parent in the activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent ID (note - parameter name should be parentId)
 *         example: "parent-uuid-1"
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Parent unchecked-in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: "Parent unchecked-in successfully"
 *       400:
 *         description: Parent not checked-in or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_checked_in:
 *                 value:
 *                   message: "Parent is not checked-in"
 *               missing_params:
 *                 value:
 *                   message: "Parent ID, Station ID and Activity Session ID are required"
 *               not_registered:
 *                 value:
 *                   message: "Parent is not registered for this activity session in this station"
 *               not_assigned:
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
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
 *               parent_not_found:
 *                 value:
 *                   message: "Parent not found"

 *               activity_not_found:
 *                 value:
 *                   message: "Activity session not found"
 *               station_not_found:
 *                 value:
 *                   message: "Station not found in this activity session"
 *               no_stations:
 *                 value:
 *                   message: "Activity session not found or no more stations left"
 */


/**
 * @swagger
 * /activity-session/actions/parentStatus:
 *   get:
 *     summary: Get parent check-in status
 *     description: Returns parents that have been checked-in and parents yet to be checked-in for the activity session.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activitySessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity session ID
 *         example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *     responses:
 *       200:
 *         description: Parent status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parentsCheckedIn:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                 parentsYetToCheckIn:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *       400:
 *         description: Bad request
 *       404:
 *         description: Activity session not found
 */
