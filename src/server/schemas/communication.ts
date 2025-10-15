import { z } from 'zod';

export const CommunicationSchema = z.object({
    conversation_id: z.string().optional(),
    members: z.array(z.object({ email: z.string(), name: z.string() })),
    chat_name: z.string().optional(), // chat_name remains optional in the schema
    messages: z.array(
        z.object({
            sender_id: z.string(),
            timestamp: z.string(),
            content: z.string(),
        })
    ).optional().default([]),
});

export const MessageSchema = z.object({
    sender_id: z.string(),
    sender_name: z.string(),
    content: z.string()
})