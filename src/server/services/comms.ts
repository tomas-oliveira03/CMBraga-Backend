import { AppDataSource } from "@/db";
import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";

const MESSAGES_PER_PAGE = 20;

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
            .findOne({ where: { id: userId } });
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

export async function getMessagesFromChat(chatId: string, page: number): Promise<{ messages: Partial<Message>[], members?: { name: string, email: string }[] }> {
    try {
        const query = AppDataSource.getRepository(Message)
            .createQueryBuilder("message")
            .where("message.chatId = :chatId", { chatId })
            .orderBy("message.timestamp", "DESC");

        if (page > 0) {
            query.skip((page - 1) * MESSAGES_PER_PAGE).take(MESSAGES_PER_PAGE);
        } else {
            query.take(MESSAGES_PER_PAGE);
        }

        const messages = await query.getMany();

        // Map messages to exclude senderId, chatId, and id
        const mappedMessages = messages.map(({ content, timestamp, senderName }) => ({
            content,
            timestamp,
            senderName,
        }));

        if (page === 0) {
            const chat = await AppDataSource.getRepository(Chat)
                .createQueryBuilder("chat")
                .innerJoinAndSelect("chat.userChat", "userChat")
                .innerJoinAndSelect("userChat.user", "user")
                .where("chat.id = :chatId", { chatId })
                .getOne();

            if (!chat) {
                throw new Error("Chat not found");
            }

            const members = chat.userChat.map(userChat => ({
                name: userChat.user.name,
                email: userChat.user.id,
            }));

            return { messages: mappedMessages, members };
        }

        return { messages: mappedMessages };
    } catch (error) {
        console.error("Error retrieving messages from chat:", error);
        throw new Error("Failed to retrieve messages from chat");
    }
}

export async function searchSimilarUsers(query: string): Promise<User[] | null> {
    try {
        // Given a part of a name or email, find if it belongs to any user, even if in middle of name or email
        const users = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .where("user.name LIKE :query OR user.id LIKE :query", { query: `%${query}%` })
            .getMany();
        return users;
    } catch (error) {
        console.error("Error searching for users:", error);
        throw new Error("Failed to search for users");
    }
}