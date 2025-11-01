import { z } from 'zod';

export const CommunicationSchema = z.object({
    conversationId: z.string().optional(),
    members: z.array(z.email()),
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
    content: z.string()
})