"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSchema = exports.CommunicationSchema = void 0;
const zod_1 = require("zod");
exports.CommunicationSchema = zod_1.z.object({
    conversation_id: zod_1.z.string().optional(),
    members: zod_1.z.array(zod_1.z.object({ email: zod_1.z.string(), name: zod_1.z.string() })),
    messages: zod_1.z.array(zod_1.z.object({
        sender_id: zod_1.z.string(),
        timestamp: zod_1.z.string(),
        content: zod_1.z.string(),
    })).optional().default([]),
});
exports.MessageSchema = zod_1.z.object({
    sender_id: zod_1.z.string(),
    sender_name: zod_1.z.string(),
    content: zod_1.z.string()
});
