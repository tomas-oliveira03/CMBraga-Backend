import { z } from 'zod';

export const CommunicationSchema = z.object({
    conversation_id: z.string().optional(),
    members: z.array(z.object({ id: z.string(), name: z.string() })),
    messages: z.array(
        z.object({
            sender_id: z.string(),
            timestamp: z.string(),
            content: z.string(),
        })
    ).optional().default([]),
});