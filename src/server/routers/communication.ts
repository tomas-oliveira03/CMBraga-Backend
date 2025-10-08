import express, { Request, Response } from "express";
import { AppDataSource } from "@/db";
import { CommunicationSchema, MessageSchema } from "../schemas/communication";
import { z } from "zod";
import { webSocketManager } from "../services/websocket";
import { authenticate } from "../middleware/auth";
import { NotificationType } from "@/helpers/types";
import { v4 as uuidv4 } from 'uuid';

import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";
import { TypeOfChat } from "@/helpers/types";

import { checkIfChatAlreadyExists, checkIfUserInChat, checkIfUserExists, checkIfChatExists } from "../services/comms";

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
 *           example:
 *             members:
 *               - email: "user@example.com"
 *                 name: "John Doe"
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
 *       400:
 *         description: Validation error or conversation already exists.
 *       401:
 *         description: Unauthorized access.
 *       500:
 *         description: Internal server error.
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const parsed = CommunicationSchema.parse(req.body);

        // Check if there is atleast 2 members
        if (parsed.members.length < 2) {
            return res.status(400).json({ message: "At least two members are required to create a conversation" });
        }

        const exists = await checkIfChatAlreadyExists(parsed.members.map(m => m.email));
        if (exists !== null) {
            return res.status(400).json({ message: "Conversation already exists" });
        }

        let conversationId = uuidv4();

        const num_members = parsed.members.length;

        // Find if a conversation with the exact same members already exists
        let alreadyExists = await AppDataSource.getRepository(Chat).findOne({
            where: {
                id: conversationId,
            }
        });

        while (alreadyExists !== null) {
            conversationId = uuidv4();
            alreadyExists = await AppDataSource.getRepository(Chat).findOne({
                where: {
                    id: conversationId,
                }
            });
        }

        const newChat = new Chat();
        newChat.id = conversationId;
        newChat.chatType = num_members > 2 ? TypeOfChat.GROUP_CHAT : TypeOfChat.INDIVIDUAL_CHAT;
        newChat.destinatairePhoto = "default-photo-url";
        newChat.messages = [];
        
        const userChatEntries = await Promise.all(parsed.members.map(async member => {
            const userChat = new UserChat();
            userChat.userId = member.email;
            userChat.chatId = conversationId;

            return userChat;
        }));

        await AppDataSource.getRepository(Chat).save(newChat);
        await AppDataSource.getRepository(UserChat).save(userChatEntries);

        return res.status(201).json({ message: "Conversation created successfully", conversation_id: conversationId });
    } catch (error) {
        if (error instanceof z.ZodError) {
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
 *             content: "Hello, how are you?"
 *     responses:
 *       201:
 *         description: Message sent successfully.
 *       400:
 *         description: Missing conversationId or validation error.
 *       401:
 *         description: Unauthorized access.
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
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }

        // Validate request body with MessageSchema
        const parsed = MessageSchema.parse(req.body);
        const sender_id = parsed.sender_id;

        // Check if user exists
        const userExists = await checkIfUserExists(sender_id);
        if (!userExists) {
            return res.status(400).json({ message: "Sender does not exist" });
        }

        // Check if conversation exists
        const chatExists = await checkIfChatExists(conversationId);
        if (!chatExists) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Check if sender is part of the chat
        const isUserInChat = await checkIfUserInChat(sender_id, conversationId);
        if (!isUserInChat) {
            return res.status(403).json({ message: "Sender is not a member of the conversation" });
        }

        // Create a new message
        const newMessage = new Message();
        newMessage.content = parsed.content;
        newMessage.timestamp = new Date();
        newMessage.chatId = conversationId;
        newMessage.senderId = sender_id;
        newMessage.senderName = parsed.sender_name;

        await AppDataSource.getRepository(Message).save(newMessage);

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
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /communication/{conversationId}:
 *   get:
 *     summary: Get a communication by ID
 *     description: Retrieves a communication conversation by its ID, with optional pagination using the `jump` query parameter.
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
 *                       content:
 *                         type: string
 *                         example: "Hello, how are you?"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-10-01T12:00:00Z"
 *       400:
 *         description: Missing conversationId parameter.
 *       401:
 *         description: Unauthorized access.
 *       404:
 *         description: Communication not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:conversationId", async (req: Request, res: Response) => {
    try {
        return res.status(200).json();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
