import { z } from 'zod';

export const CommunicationSchema = z.object({
    conversationId: z.string().optional(),
    members: z.array(z.object({ email: z.string(), name: z.string() })),
    chatName: z.string().optional(), // chatName remains optional in the schema
    messages: z.array(
        z.object({
            senderId: z.string(),
            timestamp: z.string(),
            content: z.string(),
        })
    ).optional().default([]),
});

export const MessageSchema = z.object({
    senderId: z.string(),
    senderName: z.string(),
    content: z.string()
})