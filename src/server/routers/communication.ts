import express, { Request, Response } from "express";
import { AppDataSource } from "@/db";
import { CommunicationSchema, MessageSchema } from "../schemas/communication";
import { z } from "zod";
import { webSocketManager } from "../services/websocket";
import { authenticate, authorize } from "@/server/middleware/auth";
import { NotificationType } from "@/helpers/types";

import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";
import { TypeOfChat } from "@/helpers/types";

import { checkIfChatAlreadyExists, checkIfUserInChat, checkIfUserExists, checkIfChatExists, getMessagesFromChat, getChat, checkIfEmailsExist } from "../services/comms";
import { webSocketEvents } from "../services/websocket-events";
import informationHash from "@/lib/information-hash";
const router = express.Router();

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
router.post("/", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userEmail = req.user.email;

        // parse with new schema: members is an array of email strings
        const parsed = CommunicationSchema.parse(req.body);

        // sanitize members: remove any occurrence of the authenticated user's email and deduplicate
        const rawMembers: string[] = Array.isArray(parsed.members) ? parsed.members : [];
        const filtered = rawMembers.filter(m => typeof m === "string" && m.trim().length > 0 && m !== userEmail);
        const uniqueMembers = Array.from(new Set(filtered));

        if (uniqueMembers.length < 1) {
            return res.status(400).json({ message: "At least one member (other than the authenticated user) is required to create a conversation" });
        }

        // determine total members including the authenticated user
        const members_emails = [...uniqueMembers, userEmail];
        const num_members = members_emails.length;

        // group chats (more than 2 people) require a chatName
        if (num_members > 2 && !parsed.chatName) {
            return res.status(400).json({ message: "A chat name must be provided for group chats" });
        }

        const allExist = await checkIfEmailsExist(members_emails);
        if (!allExist) {
            return res.status(400).json({ message: "One or more specified users do not exist" });
        }

        const exists = await checkIfChatAlreadyExists(members_emails);
        if (exists !== null) {
            return res.status(400).json({ message: "Conversation already exists", chatId: exists.id });
        }

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

            const userChatEntries = members_emails.map(member => ({
                userId: member,
                chatId: conversationId,
            }));

            // Create new chat room in WebSocket manager
            webSocketEvents.addNewChatRoom(conversationId!, members_emails);

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
router.post("/messages/:conversationId", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const senderId = req.user.email;
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }

        const parsed = MessageSchema.parse(req.body);
        const sender_id = senderId;

        const userExists = await checkIfUserExists(sender_id);
        if (!userExists) {
            return res.status(400).json({ message: "Sender does not exist" });
        }

        const chatExists = await getChat(conversationId)
        if (!chatExists) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const isUserInChat = await checkIfUserInChat(sender_id, conversationId);
        if (!isUserInChat) {
            return res.status(403).json({ message: "Sender is not a member of the conversation" });
        }

        const user = await AppDataSource.getRepository(User).findOne({ where: { id: sender_id } });
        const senderName = user ? user.name : "Unknown";

        const newMessage = {
            content: informationHash.encrypt(parsed.content),
            timestamp: new Date(),
            chatId: conversationId,
            senderId: sender_id
        };

        await AppDataSource.getRepository(Message).insert(newMessage);

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
router.get("/chat/:conversationId", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const senderId = req.user.email;
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }

        const validation = z.string().uuid().safeParse(conversationId);
        if (!validation.success) {
            return res.status(400).json({ message: "Invalid conversationId: must be a valid UUID" });
        }

        const isInChat = await checkIfUserInChat(senderId, conversationId);
        if (!isInChat) {
            return res.status(403).json({ message: "Forbidden: You are not a member of this conversation" });
        }

        const jump = parseInt(req.query.jump as string) || 0;
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
router.get("/my-chats", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.user.email;
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

                // decrypt message content if present
                const messageContent = mostRecentMessage ? informationHash.decrypt(mostRecentMessage.content) : null;

                // fetch sender name if senderId exists
                let senderName: string | null = null;
                if (mostRecentMessage?.senderId) {
                    const senderUser = await AppDataSource.getRepository(User).findOne({
                        where: { id: mostRecentMessage.senderId },
                        select: { name: true }
                    });
                    senderName = senderUser ? senderUser.name : null;
                }

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
                    messageContent: messageContent,
                    senderName: senderName,
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