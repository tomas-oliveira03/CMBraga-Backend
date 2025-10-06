import express, { Request, Response } from "express";
import { saveCommunication, getCommunication } from "@/db/models/communication";
import { CommunicationSchema } from "../schemas/communication";
import { z } from "zod";
import { webSocketManager } from "../services/websocket";
import { authenticate } from "../middleware/auth";
import { NotificationType } from "@/helpers/types";
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * @swagger
 * /communication:
 *   post:
 *     summary: Create a new communication
 *     description: Creates a new communication conversation.
 *     tags:
 *       - Communication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversation_id
 *               - members
 *             properties:
 *               conversation_id:
 *                 type: string
 *                 example: "conversation-uuid"
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-uuid"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *           example:
 *             conversation_id: "conversation-uuid"
 *             members:
 *               - id: "user-uuid"
 *                 name: "John Doe"
 *     responses:
 *       201:
 *         description: Conversation created successfully.
 *       400:
 *         description: Validation error or conversation already exists.
 *       401:
 *         description: Unauthorized access.
 *       500:
 *         description: Internal server error.
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const communication = CommunicationSchema.parse(req.body);
        let conv_uuid = uuidv4();
        let existingCommunication = await getCommunication(conv_uuid);
        while(existingCommunication != null){
            conv_uuid = uuidv4();
            existingCommunication = await getCommunication(conv_uuid);
        }

        communication.conversation_id = conv_uuid as string;

        await saveCommunication(communication as Required<typeof communication>);

        return res.status(201).json({ message: "Conversation created successfully", conversation_id: communication.conversation_id });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: "Internal server error" });
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
 *               - content
 *             properties:
 *               sender_id:
 *                 type: string
 *                 example: "user-uuid"
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
        const { sender_id, content } = req.body;

        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }

        const communication = await getCommunication(conversationId);
        if (!communication) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const isMember = communication.members.some(member => member.id === sender_id);
        if (!isMember) {
            return res.status(403).json({ message: "Sender is not a member of the conversation" });
        }

        const newMessage = {
            sender_id,
            content,
            timestamp: new Date().toISOString(),
        };

        communication.messages.push(newMessage);
        await saveCommunication(communication);

        // Send WebSocket notification to room members
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

        return res.status(201).json({ message: "Message sent successfully", messageData: newMessage });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /communication/{conversationId}:
 *   get:
 *     summary: Get a communication by ID
 *     description: Retrieves a communication conversation by its ID.
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
 *     responses:
 *       200:
 *         description: Communication retrieved successfully.
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
        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }
        const communication = await getCommunication(conversationId);
        if (!communication) {
            return res.status(404).json({ message: "Communication not found" });
        }
        return res.status(200).json(communication);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
