import { z } from "zod";

export const NotificationSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    type: z.string(),
    title: z.string(),
    description: z.string(),
    is_read: z.boolean(),
    uri: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date().nullable()
})

export const UpdateNotificationSchema = NotificationSchema.omit({
    id: true,
    user_id: true,
    type: true,
    title: true,
    description: true,
    uri: true,
    created_at: true,
    updated_at: true
}).partial();


export type Notification = z.infer<typeof NotificationSchema>;

