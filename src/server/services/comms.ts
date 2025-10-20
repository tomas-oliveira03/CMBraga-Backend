import { AppDataSource } from "@/db";
import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";
import { UserRole } from "@/helpers/types";

const MESSAGES_PER_PAGE = 20;
const USERS_PER_PAGE = 10;

export async function checkIfChatAlreadyExists(usersIDs: string[]): Promise<Chat | null> {
    try {
        const starting_user = usersIDs[0];
        const chatUserChats = await AppDataSource.getRepository(UserChat)
            .createQueryBuilder("userChat")
            .innerJoinAndSelect("userChat.chat", "chat")
            .where("userChat.userId = :starting_user", { starting_user })
            .getMany();

        for (const userChat of chatUserChats) {
            const chatId = userChat.chatId;
            const members = await AppDataSource.getRepository(UserChat)
                .find({ where: { chatId } });
            const memberIds = members.map(m => m.userId);
            if (memberIds.length === usersIDs.length && usersIDs.every(id => memberIds.includes(id))) {
                return userChat.chat;
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


export async function getChat(chatId: string): Promise<Chat | null> {
    try {
        const chat = await AppDataSource.getRepository(Chat)
            .findOne({ where: { id: chatId } });
        return chat || null;
    } catch (error) {
        console.error("Error checking if chat exists:", error);
        throw new Error("Failed to check if chat exists");
    }
}

export async function getMessagesFromChat(chatId: string, page: number): Promise<{ messages: Partial<Message>[], members?: { name: string, email: string }[], chatName?: string }> {
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

            return { messages: mappedMessages, members, chatName: chat.chatName ?? undefined };
        }

        return { messages: mappedMessages };
    } catch (error) {
        console.error("Error retrieving messages from chat:", error);
        throw new Error("Failed to retrieve messages from chat");
    }
}

export async function searchSimilarUsers(query: string, pageNumber: number): Promise<User[] | null> {
    try {
        // Given a part of a name or email, find if it belongs to any user, even if in middle of name or email
        const users = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .skip(pageNumber * USERS_PER_PAGE)
            .take(USERS_PER_PAGE)
            .where("user.name LIKE :query OR user.id LIKE :query", { query: `%${query}%` })
            .getMany();
        return users;
    } catch (error) {
        console.error("Error searching for users:", error);
        throw new Error("Failed to search for users");
    }
}

export async function getAlphabeticOrderedUsers(jump: number): Promise<User[]> {
    try {
        const users = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .orderBy("user.name", "ASC")
            .skip(jump * USERS_PER_PAGE)
            .take(USERS_PER_PAGE)
            .getMany();
        return users;
    } catch (error) {
        console.error("Error retrieving users:", error);
        throw new Error("Failed to retrieve users");
    }
}

// Helper: normalize user objects to { id, name, role }
export function normalizeUsers(users: any[]) {
    return (users || []).map(u => {
        const role =
            u.adminId ? UserRole.ADMIN :
            u.instructorId ? UserRole.INSTRUCTOR :
            u.parentId ? UserRole.PARENT :
            u.healthProfessionalId ? UserRole.HEALTH_PROFESSIONAL :
            UserRole.HEALTH_PROFESSIONAL;

        return {
            id: u.id,
            name: u.name,
            role
        };
    });
}