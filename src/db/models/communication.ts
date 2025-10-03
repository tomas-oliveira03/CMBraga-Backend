import { getMongoDB } from "@/db/mongo";

const COLLECTION_NAME = "communications";

export type Communication = {
    conversation_id: string;
    members: { id: string; name: string }[];
    messages: { sender_id: string; timestamp: string; content: string }[];
};

export async function saveCommunication(communication: Communication): Promise<void> {
    const db = getMongoDB();
    await db.collection(COLLECTION_NAME).insertOne(communication);
}

export async function getCommunication(conversationId: string): Promise<Communication | null> {
    const db = getMongoDB();
    const result = await db.collection(COLLECTION_NAME).findOne({ conversation_id: conversationId });
    if (!result) return null;
    const { conversation_id, members, messages } = result;
    return { conversation_id, members, messages } as Communication;
}
