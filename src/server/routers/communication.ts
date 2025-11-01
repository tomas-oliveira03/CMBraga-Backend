import express, { Request, Response } from "express";
import { AppDataSource } from "@/db";
import { CommunicationSchema, MessageSchema } from "../schemas/communication";
import { z } from "zod";
import { webSocketManager } from "../services/websocket";
import { authenticate } from "../middleware/auth";
import { NotificationType } from "@/helpers/types";

import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";
import { TypeOfChat } from "@/helpers/types";

import { checkIfChatAlreadyExists, checkIfUserInChat, checkIfUserExists, checkIfChatExists, getMessagesFromChat, getChat } from "../services/comms";
import { webSocketEvents } from "../services/websocket-events";
import informationHash from "@/lib/information-hash";

const router = express.Router();

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
 *               chatName:
 *                 type: string
 *                 example: "Project Team"
 *                 description: The name of the chat (required for group chats).
 *           example:
 *             members:
 *               - email: "user1@example.com"
 *                 name: "John Doe"
 *               - email: "user2@example.com"
 *                 name: "Jane Doe"
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
 *                   example: "Conversation created successfully"
 *                 conversationId:
 *                   type: string
 *                   example: "conversation-id"
 *                 chatType:
 *                   type: string
 *                   example: "GROUP_CHAT"
 *       400:
 *         description: Validation error or conversation already exists.
 *       500:
 *         description: Internal server error.
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const parsed = CommunicationSchema.parse(req.body);

        // Check if there is at least 2 members
        if (parsed.members.length < 2) {
            return res.status(400).json({ message: "At least two members are required to create a conversation" });
        }

        // Ensure chatName is provided for group chats
        if (parsed.members.length > 2 && !parsed.chatName) {
            return res.status(400).json({ message: "A chat name must be provided for group chats" });
        }

        const exists = await checkIfChatAlreadyExists(parsed.members.map(m => m.email));
        if (exists !== null) {
            return res.status(400).json({ message: "Conversation already exists", chatId: exists.id });
        }

        const num_members = parsed.members.length;

        const newChat = {
            chatType: num_members > 2 ? TypeOfChat.GROUP_CHAT : TypeOfChat.INDIVIDUAL_CHAT,
            destinatairePhoto: "default-photo-url",
            chatName: num_members > 2 ? parsed.chatName : null,
            messages: [],
        };

        let conversationId: string | undefined;

        await AppDataSource.transaction(async tx => {

            const chat = await tx.getRepository(Chat).insert(newChat);
            conversationId = chat.identifiers[0]?.id

            const userChatEntries = parsed.members.map(member => ({
                userId: member.email,
                chatId: conversationId,
            }));

            // Create new chat room in WebSocket manager
            webSocketEvents.addNewChatRoom(conversationId!, parsed.members.map(m => m.email));

            await tx.getRepository(UserChat).insert(userChatEntries);
        });

        return res.status(201).json({ message: "Conversation created successfully", chatId: conversationId });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
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
 *           example: "conversation-id"
 *         description: The ID of the conversation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *               - senderName
 *               - content
 *             properties:
 *               senderId:
 *                 type: string
 *                 example: "user@example.com"
 *                 description: The user's email used as identifier.
 *               senderName:
 *                 type: string
 *                 example: "John Doe"
 *               content:
 *                 type: string
 *                 example: "Hello, how are you?"
 *           example:
 *             senderId: "user@example.com"
 *             senderName: "John Doe"
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
router.post("/messages/:conversationId", async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }

        // Validate request body with MessageSchema
        const parsed = MessageSchema.parse(req.body);
        const sender_id = parsed.senderId;

        // Check if user exists
        const userExists = await checkIfUserExists(sender_id);
        if (!userExists) {
            return res.status(400).json({ message: "Sender does not exist" });
        }

        // Check if conversation exists
        const chatExists = await getChat(conversationId)
        if (!chatExists) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Check if sender is part of the chat
        const isUserInChat = await checkIfUserInChat(sender_id, conversationId);
        if (!isUserInChat) {
            return res.status(403).json({ message: "Sender is not a member of the conversation" });
        }

        // Create a new message
        const newMessage = {
            content: informationHash.encrypt(parsed.content),
            timestamp: new Date(),
            chatId: conversationId,
            senderId: sender_id,
            senderName: parsed.senderName,
        };

        await AppDataSource.getRepository(Message).insert(newMessage);

        // Send WebSocket notification to room members
        webSocketEvents.sendMessageToChatRoom(conversationId, chatExists.chatType, chatExists.chatName, sender_id, parsed.content);
        

        return res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /communication/{conversationId}:
 *   get:
 *     summary: Get messages from a conversation
 *     description: Retrieves encrypted messages from a conversation with pagination. On first page (jump=0), also returns chat members and chat name.
 *     tags:
 *       - Communication
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
 *                   description: Array of messages in the conversation (decrypted content)
 *                   items:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                         example: "Hello, how are you?"
 *                         description: The decrypted message content
 *                       senderName:
 *                         type: string
 *                         example: "John Doe"
 *                         description: Name of the message sender
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-10-01T12:00:00.000Z"
 *                         description: When the message was sent (ISO 8601 format)
 *                 members:
 *                   type: array
 *                   description: Chat members information (only returned when jump=0)
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Jane Smith"
 *                         description: Member's full name
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "jane.smith@example.com"
 *                         description: Member's email address (user ID)
 *                       profilePictureURL:
 *                         type: string
 *                         format: uri
 *                         example: "https://storage.example.com/profiles/user-123.jpg"
 *                         description: URL to member's profile picture
 *                 chatName:
 *                   type: string
 *                   nullable: true
 *                   example: "Project Team"
 *                   description: Name of the chat (only for group chats, null for individual chats, returned when jump=0)
 *             examples:
 *               firstPageGroupChat:
 *                 summary: First page of a group chat (jump=0)
 *                 value:
 *                   messages:
 *                     - content: "Let's schedule a meeting for tomorrow"
 *                       senderName: "John Doe"
 *                       timestamp: "2023-10-01T14:30:00.000Z"
 *                     - content: "Great idea! I'm available after 2pm"
 *                       senderName: "Jane Smith"
 *                       timestamp: "2023-10-01T14:25:00.000Z"
 *                     - content: "Hello team!"
 *                       senderName: "Bob Johnson"
 *                       timestamp: "2023-10-01T12:00:00.000Z"
 *                   members:
 *                     - name: "Jane Smith"
 *                       email: "jane.smith@example.com"
 *                       profilePictureURL: "https://storage.example.com/profiles/jane.jpg"
 *                     - name: "Bob Johnson"
 *                       email: "bob.johnson@example.com"
 *                       profilePictureURL: "https://storage.example.com/profiles/bob.jpg"
 *                   chatName: "Project Team"
 *               firstPageIndividualChat:
 *                 summary: First page of an individual chat (jump=0)
 *                 value:
 *                   messages:
 *                     - content: "See you tomorrow!"
 *                       senderName: "Alice Brown"
 *                       timestamp: "2023-10-01T16:45:00.000Z"
 *                     - content: "Thanks for the help!"
 *                       senderName: "John Doe"
 *                       timestamp: "2023-10-01T16:40:00.000Z"
 *                   members:
 *                     - name: "Alice Brown"
 *                       email: "alice.brown@example.com"
 *                       profilePictureURL: "https://storage.example.com/profiles/alice.jpg"
 *                   chatName: null
 *               subsequentPage:
 *                 summary: Subsequent page (jump=1 or higher)
 *                 value:
 *                   messages:
 *                     - content: "Good morning everyone"
 *                       senderName: "Bob Johnson"
 *                       timestamp: "2023-09-30T09:15:00.000Z"
 *                     - content: "Have a great weekend!"
 *                       senderName: "Jane Smith"
 *                       timestamp: "2023-09-29T17:30:00.000Z"
 *       400:
 *         description: Missing or invalid conversationId parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing conversationId parameter"
 *       404:
 *         description: Conversation not found or has no messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Communication not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve messages from chat"
 */
router.get("/:conversationId", async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const jump = parseInt(req.query.jump as string) || 0;
        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }
        const chatData = await getMessagesFromChat(conversationId, jump);

        if (!chatData.messages || chatData.messages.length === 0) {
            return res.status(404).json({ message: "Communication not found" });
        }

        if (jump === 0 && chatData.members) {
            return res.status(200).json({ members: chatData.members, messages: chatData.messages });
        }

        return res.status(200).json({ messages: chatData.messages });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /communication/chats/{userId}:
 *   get:
 *     summary: Get chats for a user
 *     description: Retrieves a paginated list of chats for a specific user (userId is the user's email), sorted by the most recent message.
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
 *                         example: "chat-id"
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
router.get("/chats/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        // Safe parse to allow 0 as a valid page value
        const rawPage = req.query.page;
        let page = 1;
        if (rawPage !== undefined) {
            const parsed = parseInt(rawPage as string, 10);
            if (!isNaN(parsed) && parsed >= 0) page = parsed;
        }
        const limit = 10;

        const userExists = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        const chats = await AppDataSource.getRepository(Chat)
            .createQueryBuilder("chat")
            .leftJoinAndSelect("chat.messages", "message")
            .innerJoin("chat.userChat", "userChat")
            .where("userChat.userId = :userId", { userId })
            .orderBy("message.timestamp", "DESC")
            .addOrderBy("chat.id", "ASC")
            .getMany();

        const sortedChats = await Promise.all(
            chats.map(async chat => {
                const mostRecentMessage = chat.messages?.[0];
                const members = await AppDataSource.getRepository(UserChat)
                    .createQueryBuilder("userChat")
                    .innerJoinAndSelect("userChat.user", "user")
                    .where("userChat.chatId = :chatId", { chatId: chat.id })
                    .andWhere("userChat.userId != :userId", { userId })
                    .getMany();

                const memberDetails = members.map(member => ({
                    name: member.user.name,
                    email: member.user.id,
                    profilePictureURL: member.user.profilePictureURL
                }));
    
                return {
                    chatId: chat.id,
                    chatType: chat.chatType,
                    chatName: chat.chatName,
                    messageContent: mostRecentMessage?.content || null,
                    sender: mostRecentMessage?.senderName || null,
                    timestamp: mostRecentMessage?.timestamp || null,
                    members: memberDetails,
                };
            })
        );

        const paginatedChats = sortedChats
            .sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                }
                if (a.timestamp) return -1;
                if (b.timestamp) return 1;
                return 0;
            })
            .slice((page - 1) * limit, page * limit);

        return res.status(200).json({ chats: paginatedChats, page });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;