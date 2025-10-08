import express, { Request, Response } from "express";
import { CommunicationSchema } from "../schemas/communication";
import { z } from "zod";
import { webSocketManager } from "../services/websocket";
import { authenticate } from "../middleware/auth";
import { NotificationType } from "@/helpers/types";
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// #TODO: Add access control not based in user passed in the request, but authenticated user

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
        return res.status(201).json();
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

        return res.status(201).json();
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
