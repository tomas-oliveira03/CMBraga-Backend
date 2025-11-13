/**
 * @swagger
 * /communication:
 *   post:
 *     summary: Create a new communication
 *     description: Creates a new communication conversation with an empty messages array. The authenticated user is automatically added as a member; do not include the authenticated user's email in the members list.
 *     tags:
 *       - Communication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - members
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                   example: "user@example.com"
 *                 description: Array of member email addresses (exclude the authenticated user's email).
 *               chatName:
 *                 type: string
 *                 example: "Project Team"
 *                 description: The name of the chat (required for group chats).
 *           example:
 *             members:
 *               - "user1@example.com"
 *               - "user2@example.com"
 *             chatName: "Project Team"
 *     responses:
 *       201:
 *         description: Conversation created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 chatId:
 *                   type: string
 *                   format: uuid
 *                 chatType:
 *                   type: string
 *                   enum: [group_chat, individual_chat, general_chat]
 *             example:
 *               message: "Conversation created successfully"
 *               chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               chatType: "group_chat"
 *       400:
 *         description: Validation error or conversation already exists.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Internal server error.
 */


/**
 * @swagger
 * /communication/messages/{conversationId}:
 *   post:
 *     summary: Add a message to a conversation (authenticated user)
 *     description: Adds a new message to an existing communication conversation. The sender is the authenticated user; do not provide senderId in the request body.
 *     tags:
 *       - Communication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the conversation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Hello, how are you?"
 *           example:
 *             content: "Hello, how are you?"
 *     responses:
 *       201:
 *         description: Message sent successfully.
 *       400:
 *         description: Validation error, missing conversationId, or sender does not exist.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Sender is not a member of the conversation.
 *       404:
 *         description: Conversation not found.
 *       500:
 *         description: Internal server error.
 */


/**
 * @swagger
 * /communication/chat/{conversationId}:
 *   get:
 *     summary: Get messages from a conversation
 *     description: Retrieves encrypted messages from a conversation with pagination. On first page (jump=0), also returns chat members and chat name.
 *     tags:
 *       - Communication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: The unique identifier of the conversation (chat ID)
 *       - in: query
 *         name: jump
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 0
 *         description: Page number for pagination. Use 0 for first page (includes member info and chat name), 1+ for subsequent pages (messages only)
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                         description: Decrypted message content
 *                       senderName:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 members:
 *                   type: array
 *                   nullable: true
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       profilePictureURL:
 *                         type: string
 *                 chatName:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Missing or invalid conversationId parameter
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden - user not a member
 *       404:
 *         description: Conversation not found or has no messages
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /communication/my-chats:
 *   get:
 *     summary: Get chats for the authenticated user
 *     description: Retrieves a paginated list of chats for the authenticated user, sorted by the most recent message. Uses the authenticated user's email as the identifier.
 *     tags:
 *       - Communication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: The page number for pagination (1-based). Default is 1.
 *     responses:
 *       200:
 *         description: Chats retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       chatId:
 *                         type: string
 *                       chatType:
 *                         type: string
 *                       chatName:
 *                         type: string
 *                         nullable: true
 *                       messageContent:
 *                         type: string
 *                         nullable: true
 *                       senderName:
 *                         type: string
 *                         nullable: true
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       members:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                             profilePictureURL:
 *                               type: string
 *                 page:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized - authentication required.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */


/**
 * @swagger
 * /communication/chats/{conversationId}/members:
 *   post:
 *     summary: Add members to a group conversation
 *     description: Adds one or more users to an existing group conversation. Request must be made by an existing member of the group. Provide an array of email addresses in the request body under the property "newMembers".
 *     tags:
 *       - Communication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the conversation to which new members will be added.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newMembers
 *             properties:
 *               newMembers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Array of member email addresses to add to the group chat.
 *           example:
 *             newMembers:
 *               - "newuser1@example.com"
 *               - "newuser2@example.com"
 *     responses:
 *       200:
 *         description: New members added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "New members added successfully"
 *       400:
 *         description: Validation error or one or more specified users do not exist.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: At least one member is already in the chat.
 *       404:
 *         description: Conversation not found or not a group chat.
 *       500:
 *         description: Internal server error.
 */


/**
 * @swagger
 * /communication/chats/{conversationId}/leave:
 *   post:
 *     summary: Leave a group conversation
 *     description: Authenticated user leaves the specified group conversation. Cannot be used on individual chats.
 *     tags:
 *       - Communication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the group conversation to leave.
 *     responses:
 *       200:
 *         description: Left the group chat successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "You have left the group chat successfully"
 *       400:
 *         description: Invalid request (e.g., trying to leave an individual chat).
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Forbidden - user not a member of the conversation.
 *       404:
 *         description: Conversation not found.
 *       500:
 *         description: Internal server error.
 */
