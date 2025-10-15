"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../../db");
const communication_1 = require("../schemas/communication");
const zod_1 = require("zod");
const Message_1 = require("../../db/entities/Message");
const User_1 = require("../../db/entities/User");
const UserChat_1 = require("../../db/entities/UserChat");
const Chat_1 = require("../../db/entities/Chat");
const types_1 = require("../../helpers/types");
const comms_1 = require("../services/comms");
const router = express_1.default.Router();
// TODO: Add access control not based in user passed in the request, but authenticated user
/**
 * @swagger
 * /communication:
 *   post:
 *     summary: Create a new communication
 *     description: Creates a new communication conversation with an empty messages array.
 *     tags:
 *       - Communication
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
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *               chat_name:
 *                 type: string
 *                 example: "Project Team"
 *                 description: The name of the chat (required for group chats).
 *           example:
 *             members:
 *               - email: "user1@example.com"
 *                 name: "John Doe"
 *               - email: "user2@example.com"
 *                 name: "Jane Doe"
 *             chat_name: "Project Team"
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
 *                   example: "Conversation created successfully"
 *                 conversation_id:
 *                   type: string
 *                   example: "conversation-uuid"
 *                 chatType:
 *                   type: string
 *                   example: "GROUP_CHAT"
 *       400:
 *         description: Validation error or conversation already exists.
 *       500:
 *         description: Internal server error.
 */
router.post("/", async (req, res) => {
    try {
        const parsed = communication_1.CommunicationSchema.parse(req.body);
        // Check if there is at least 2 members
        if (parsed.members.length < 2) {
            return res.status(400).json({ message: "At least two members are required to create a conversation" });
        }
        // Ensure chat_name is provided for group chats
        if (parsed.members.length > 2 && !parsed.chat_name) {
            return res.status(400).json({ message: "A chat name must be provided for group chats" });
        }
        const exists = await (0, comms_1.checkIfChatAlreadyExists)(parsed.members.map(m => m.email));
        if (exists !== null) {
            return res.status(400).json({ message: "Conversation already exists", chatId: exists.id });
        }
        const num_members = parsed.members.length;
        const newChat = {
            chatType: num_members > 2 ? types_1.TypeOfChat.GROUP_CHAT : types_1.TypeOfChat.INDIVIDUAL_CHAT,
            destinatairePhoto: "default-photo-url",
            chatName: num_members > 2 ? parsed.chat_name : null,
            messages: [],
        };
        // Save the new chat and let the database generate the ID
        const createdChat = await db_1.AppDataSource.getRepository(Chat_1.Chat).save(newChat);
        const conversationId = String(createdChat.id);
        const userChatEntries = parsed.members.map(member => ({
            userId: member.email,
            chatId: conversationId,
        }));
        await db_1.AppDataSource.getRepository(UserChat_1.UserChat).insert(userChatEntries);
        return res.status(201).json({ message: "Conversation created successfully", conversation_id: conversationId });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ error: error });
    }
});
/**
 * @swagger
 * /communication/messages/{conversationId}:
 *   post:
 *     summary: Add a message to a conversation
 *     description: Adds a new message to an existing communication conversation.
 *     tags:
 *       - Communication
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           example: "conversation-uuid"
 *         description: The ID of the conversation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sender_id
 *               - sender_name
 *               - content
 *             properties:
 *               sender_id:
 *                 type: string
 *                 example: "user-uuid"
 *               sender_name:
 *                 type: string
 *                 example: "John Doe"
 *               content:
 *                 type: string
 *                 example: "Hello, how are you?"
 *           example:
 *             sender_id: "user-uuid"
 *             sender_name: "John Doe"
 *             content: "Hello, how are you?"
 *     responses:
 *       201:
 *         description: Message sent successfully.
 *       400:
 *         description: Validation error or missing conversationId.
 *       403:
 *         description: Sender is not a member of the conversation.
 *       404:
 *         description: Conversation not found.
 *       500:
 *         description: Internal server error.
 */
router.post("/messages/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }
        // Validate request body with MessageSchema
        const parsed = communication_1.MessageSchema.parse(req.body);
        const sender_id = parsed.sender_id;
        // Check if user exists
        const userExists = await (0, comms_1.checkIfUserExists)(sender_id);
        if (!userExists) {
            return res.status(400).json({ message: "Sender does not exist" });
        }
        // Check if conversation exists
        const chatExists = await (0, comms_1.checkIfChatExists)(conversationId);
        if (!chatExists) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        // Check if sender is part of the chat
        const isUserInChat = await (0, comms_1.checkIfUserInChat)(sender_id, conversationId);
        if (!isUserInChat) {
            return res.status(403).json({ message: "Sender is not a member of the conversation" });
        }
        // Create a new message
        const newMessage = {
            content: parsed.content,
            timestamp: new Date(),
            chatId: conversationId,
            senderId: sender_id,
            senderName: parsed.sender_name,
        };
        await db_1.AppDataSource.getRepository(Message_1.Message).insert(newMessage);
        // Send WebSocket notification to room members
        /*
        const senderMember = communication.members.find(m => m.id === sender_id);
        if (senderMember) {
            await webSocketManager.sendNotificationToRoom(conversationId, {
                type: NotificationType.MESSAGE,
                conversationId,
                title: 'New Message',
                content: content,
                from: {
        // Send WebSocket notification to room members
        /*
        const senderMember = communication.members.find(m => m.id === sender_id);
        if (senderMember) {
            await webSocketManager.sendNotificationToRoom(conversationId, {
                type: NotificationType.MESSAGE,
                conversationId,
                title: 'New Message',
                content: content,
                from: {
                    userId: senderMember.id,
                    name: (senderMember as { id: string; name?: string }).name ?? "",
                    role: req.user!.role
                },
                timestamp: newMessage.timestamp
            }, sender_id); // Exclude sender from notification
        }
        */
        return res.status(201).json({ message: "Message sent successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * @swagger
 * /communication/{conversationId}:
 *   get:
 *     summary: Get a communication by ID
 *     description: Retrieves a communication conversation by its ID, including all messages.
 *     tags:
 *       - Communication
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           example: "conversation-uuid"
 *         description: The ID of the conversation.
 *       - in: query
 *         name: jump
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *         description: The number of messages to skip for pagination.
 *     responses:
 *       200:
 *         description: Communication retrieved successfully.
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
 *                       sender_id:
 *                         type: string
 *                         example: "user-uuid"
 *                       sender_name:
 *                         type: string
 *                         example: "John Doe"
 *                       content:
 *                         type: string
 *                         example: "Hello, how are you?"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-10-01T12:00:00Z"
 *       400:
 *         description: Missing conversationId parameter.
 *       404:
 *         description: Communication not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const jump = parseInt(req.query.jump) || 0;
        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }
        const chatData = await (0, comms_1.getMessagesFromChat)(conversationId, jump);
        if (!chatData.messages || chatData.messages.length === 0) {
            return res.status(404).json({ message: "Communication not found" });
        }
        if (jump === 0 && chatData.members) {
            return res.status(200).json({ members: chatData.members, messages: chatData.messages });
        }
        return res.status(200).json({ messages: chatData.messages });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * @swagger
 * /communication/chats/{userId}:
 *   get:
 *     summary: Get chats for a user
 *     description: Retrieves a paginated list of chats for a specific user, sorted by the most recent message.
 *     tags:
 *       - Communication
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "user@example.com"
 *         description: The email of the user.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: The page number for pagination.
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
 *                         example: "chat-uuid"
 *                       messageContent:
 *                         type: string
 *                         example: "Hello, how are you?"
 *                       sender:
 *                         type: string
 *                         example: "John Doe"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-10-01T12:00:00Z"
 *                 page:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/chats/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const userExists = await db_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: userId } });
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }
        const chats = await db_1.AppDataSource.getRepository(Chat_1.Chat)
            .createQueryBuilder("chat")
            .leftJoinAndSelect("chat.messages", "message")
            .innerJoin("chat.userChat", "userChat")
            .where("userChat.userId = :userId", { userId })
            .orderBy("message.timestamp", "DESC")
            .addOrderBy("chat.id", "ASC")
            .getMany();
        const sortedChats = await Promise.all(chats.map(async (chat) => {
            const mostRecentMessage = chat.messages?.[0];
            const members = await db_1.AppDataSource.getRepository(UserChat_1.UserChat)
                .createQueryBuilder("userChat")
                .innerJoinAndSelect("userChat.user", "user")
                .where("userChat.chatId = :chatId", { chatId: chat.id })
                .andWhere("userChat.userId != :userId", { userId })
                .getMany();
            const memberDetails = members.map(member => ({
                name: member.user.name,
                email: member.user.id,
            }));
            return {
                chatId: chat.id,
                chatType: chat.chatType,
                chatName: chat.chatName, // Include chat name
                messageContent: mostRecentMessage?.content || null,
                sender: mostRecentMessage?.senderName || null,
                timestamp: mostRecentMessage?.timestamp || null,
                members: memberDetails,
            };
        }));
        const paginatedChats = sortedChats
            .sort((a, b) => {
            if (a.timestamp && b.timestamp) {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            }
            if (a.timestamp)
                return -1;
            if (b.timestamp)
                return 1;
            return 0;
        })
            .slice((page - 1) * limit, page * limit);
        return res.status(200).json({ chats: paginatedChats, page });
    }
    catch (error) {
        console.error("Error fetching user chats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
