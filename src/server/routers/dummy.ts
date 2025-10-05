import express, { Request, Response } from "express";
import { webSocketManager } from "../services/websocket";
import { saveCommunication, getCommunication } from "@/db/models/communication";
import { NotificationType, UserRole } from "@/helpers/types";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * @swagger
 * /dummy/simulate-new-user:
 *   post:
 *     summary: Simulate a new user joining
 *     description: Creates a mock user connection for testing WebSocket functionality
 *     tags:
 *       - Dummy/Testing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "test-user-123"
 *               name:
 *                 type: string
 *                 example: "Test User"
 *               role:
 *                 type: string
 *                 enum: [admin, instructor, parent, health_professional]
 *                 example: "parent"
 *     responses:
 *       200:
 *         description: Mock user created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/simulate-new-user', async (req: Request, res: Response) => {
    try {
        const { userId, name, role } = req.body;
        
        // This is just for testing - in real scenario, user would connect via WebSocket
        logger.websocket(`Simulating new user: ${userId} (${name}) with role ${role}`);
        
        return res.status(200).json({
            message: "Mock user simulation prepared",
            user: { userId, name, role },
            note: "In real scenario, user would connect via WebSocket with JWT token"
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /dummy/create-empty-conversation:
 *   post:
 *     summary: Create a new empty conversation
 *     description: Creates a new conversation with specified members but no messages
 *     tags:
 *       - Dummy/Testing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - members
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: "conv-123-456"
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 example:
 *                   - id: "parent-123"
 *                     name: "Parent User"
 *                   - id: "instructor-456"
 *                     name: "Instructor User"
 *     responses:
 *       201:
 *         description: Empty conversation created successfully
 *       400:
 *         description: Conversation already exists
 *       500:
 *         description: Internal server error
 */
router.post('/create-empty-conversation', async (req: Request, res: Response) => {
    try {
        const { conversationId, members } = req.body;
        const finalConversationId = conversationId || `conv-${uuidv4()}`;
        
        // Check if conversation already exists
        const existingConversation = await getCommunication(finalConversationId);
        if (existingConversation) {
            return res.status(400).json({ message: "Conversation already exists" });
        }

        // Create empty conversation
        const newConversation = {
            conversation_id: finalConversationId,
            members: members,
            messages: []
        };

        await saveCommunication(newConversation);
        
        return res.status(201).json({
            message: "Empty conversation created successfully",
            conversation: newConversation
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /dummy/simulate-first-message:
 *   post:
 *     summary: Simulate first message between users
 *     description: Sends the first message in a conversation between users who haven't talked before
 *     tags:
 *       - Dummy/Testing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - senderId
 *               - senderName
 *               - senderRole
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: "conv-123-456"
 *               senderId:
 *                 type: string
 *                 example: "parent-123"
 *               senderName:
 *                 type: string
 *                 example: "Parent User"
 *               senderRole:
 *                 type: string
 *                 enum: [admin, instructor, parent, health_professional]
 *                 example: "parent"
 *               content:
 *                 type: string
 *                 example: "Hello! This is my first message."
 *     responses:
 *       201:
 *         description: First message sent successfully
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.post('/simulate-first-message', async (req: Request, res: Response) => {
    try {
        const { conversationId, senderId, senderName, senderRole, content } = req.body;
        
        const communication = await getCommunication(conversationId);
        if (!communication) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const newMessage = {
            sender_id: senderId,
            content: content,
            timestamp: new Date().toISOString(),
        };

        communication.messages.push(newMessage);
        await saveCommunication(communication);

        // Send WebSocket notification to room members
        await webSocketManager.sendNotificationToRoom(conversationId, {
            type: NotificationType.MESSAGE,
            conversationId,
            title: 'First Message!',
            content: content,
            from: {
                userId: senderId,
                name: senderName,
                role: senderRole as UserRole
            },
            timestamp: newMessage.timestamp
        }, senderId);

        return res.status(201).json({
            message: "First message sent successfully",
            messageData: newMessage,
            conversationInfo: {
                id: conversationId,
                totalMessages: communication.messages.length,
                members: communication.members
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /dummy/simulate-conversation:
 *   post:
 *     summary: Simulate a full conversation
 *     description: Creates a conversation and simulates multiple messages between users
 *     tags:
 *       - Dummy/Testing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - members
 *               - messages
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: "conv-simulation-123"
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     senderId:
 *                       type: string
 *                     content:
 *                       type: string
 *                     delayMs:
 *                       type: number
 *                       description: "Delay in milliseconds before sending this message"
 *                 example:
 *                   - senderId: "parent-123"
 *                     content: "Hello, I have a question about my child."
 *                     delayMs: 0
 *                   - senderId: "instructor-456"
 *                     content: "Of course! What would you like to know?"
 *                     delayMs: 2000
 *     responses:
 *       201:
 *         description: Conversation simulation completed
 *       500:
 *         description: Internal server error
 */
router.post('/simulate-conversation', async (req: Request, res: Response) => {
    try {
        const { conversationId, members, messages } = req.body;
        const finalConversationId = conversationId || `conv-simulation-${uuidv4()}`;
        
        // Create the conversation
        const newConversation = {
            conversation_id: finalConversationId,
            members: members,
            messages: [] as any[]
        };

        await saveCommunication(newConversation);

        // Send messages with delays
        const sentMessages: any[] = [];
        
        for (const msgData of messages) {
            if (msgData.delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, msgData.delayMs));
            }

            const sender = members.find((m: any) => m.id === msgData.senderId);
            if (!sender) continue;

            const newMessage = {
                sender_id: msgData.senderId,
                content: msgData.content,
                timestamp: new Date().toISOString(),
            };

            newConversation.messages.push(newMessage);
            await saveCommunication(newConversation);

            // Send WebSocket notification
            await webSocketManager.sendNotificationToRoom(finalConversationId, {
                type: NotificationType.MESSAGE,
                conversationId: finalConversationId,
                title: 'New Message',
                content: msgData.content,
                from: {
                    userId: sender.id,
                    name: sender.name,
                    role: sender.role as UserRole
                },
                timestamp: newMessage.timestamp
            }, msgData.senderId);

            sentMessages.push(newMessage);
        }

        return res.status(201).json({
            message: "Conversation simulation completed",
            conversation: {
                id: finalConversationId,
                members: members,
                totalMessages: sentMessages.length
            },
            sentMessages: sentMessages
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /dummy/websocket-stats:
 *   get:
 *     summary: Get WebSocket connection stats
 *     description: Returns current WebSocket connection and room statistics
 *     tags:
 *       - Dummy/Testing
 *     responses:
 *       200:
 *         description: WebSocket statistics
 */
router.get('/websocket-stats', (req: Request, res: Response) => {
    return res.status(200).json({
        connectedUsers: webSocketManager.getConnectedUsersCount(),
        activeRooms: webSocketManager.getRoomsCount(),
        timestamp: new Date().toISOString()
    });
});

export default router;
