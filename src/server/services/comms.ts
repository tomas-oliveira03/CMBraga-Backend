import { AppDataSource } from "@/db";
import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";

export async function checkIfChatAlreadyExists(usersIDs: string[]): Promise<Chat | null> {
    try {
        const chats = await AppDataSource.getRepository(Chat)
            .createQueryBuilder("chat")
            .innerJoinAndSelect("chat.userChat", "userChat")
            .where("userChat.userId IN (:...usersIDs)", { usersIDs })
            .getMany();

        for (const chat of chats) {
            const chatUserIds = chat.userChat.map(userChat => userChat.userId).sort();
            if (chatUserIds.length === usersIDs.length && chatUserIds.every((id, index) => id === usersIDs.sort()[index])) {
                return chat;
            }
        }

        return null;
    } catch (error) {
        console.error("Error checking if chat already exists:", error);
        throw new Error("Failed to check if chat exists");
    }
}