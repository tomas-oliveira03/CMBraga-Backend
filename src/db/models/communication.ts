import { getMongoDB } from "@/db/mongo";

const COLLECTION_NAME = "communications";

export type Communication = {
    conversation_id: string;
    members: { id: string, name: string }[];
    messages: { sender_id: string; timestamp: string; content: string }[];
};

export async function saveCommunication(communication: Communication): Promise<void> {
    const db = getMongoDB();

    // Only append new messages
    const existingCommunication = await db.collection(COLLECTION_NAME).findOne(
        { conversation_id: communication.conversation_id },
        { projection: { messages: 1 } }
    );

    const existingMessages = existingCommunication?.messages || [];
    const newMessages = communication.messages.filter(
        (msg) => !existingMessages.some(
            (existingMsg: any) =>
                existingMsg.sender_id === msg.sender_id &&
                existingMsg.timestamp === msg.timestamp &&
                existingMsg.content === msg.content
        )
    );

    const update: any = {
        $set: { members: communication.members }
    };

    if (newMessages.length > 0) {
        update.$push = { messages: { $each: newMessages } };
    }

    await db.collection(COLLECTION_NAME).updateOne(
        { conversation_id: communication.conversation_id },
        update,
        { upsert: true }
    );
}

export async function getCommunication(conversationId: string): Promise<Communication | null> {
    const db = getMongoDB();
    const result = await db.collection(COLLECTION_NAME).findOne({ conversation_id: conversationId });
    if (!result) return null;
    const { conversation_id, members, messages } = result;
    return { conversation_id, members, messages } as Communication;
}
