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

export async function checkIfUserInChat(email: string, chatId: string): Promise<boolean> {
    try {
        const userChat = await AppDataSource.getRepository(UserChat)
            .findOne({ 
                where: { 
                    userId: email,
                    chatId: chatId
                } 
            });
        return userChat !== null;
    } catch (error) {
        console.error("Error checking if user is in chat:", error);
        throw new Error("Failed to check if user is in chat");
    }
}

export async function checkIfUserExists(userId: string): Promise<boolean> {
    try {
        const user = await AppDataSource.getRepository(User)
            .findOne({ where: { email: userId } });
        return user !== null;
    } catch (error) {
        console.error("Error checking if user exists:", error);
        throw new Error("Failed to check if user exists");
    }
}

export async function checkIfChatExists(chatId: string): Promise<boolean> {
    try {
        const chat = await AppDataSource.getRepository(Chat)
            .findOne({ where: { id: chatId } });
        return chat !== null;
    } catch (error) {
        console.error("Error checking if chat exists:", error);
        throw new Error("Failed to check if chat exists");
    }
}