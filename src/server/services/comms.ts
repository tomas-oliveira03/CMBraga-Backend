import { AppDataSource } from "@/db";
import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";
import { TypeOfChat, UserRole } from "@/helpers/types";
import informationHash from "@/lib/information-hash";
import { webSocketEvents } from "./websocket-events";
import { In } from "typeorm";
import { isDefaultGroupProfilePicture } from "@/helpers/storage";
import { deleteImageSafe, uploadImageBuffer } from "./cloud";

const MESSAGES_PER_PAGE = 20;
const USERS_PER_PAGE = 10;

export async function checkIfEmailsExist(emails: string[]): Promise<boolean> {
    try {
        const users = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .where("user.id IN (:...emails)", { emails })
            .getMany();
        return users.length === emails.length;
    } catch (error) {
        console.error("Error checking if emails exist:", error);
        throw new Error("Failed to check if emails exist");
    }
}

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

export async function getMessagesFromChat(chatId: string, page: number): Promise<{ messages: { informationHash: string, senderName: string | null, timestamp: Date }[], members?: { name: string, email: string, profilePictureURL: string }[], chatName?: string }> {
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

        // Fetch sender names in bulk and map them by id
        const senderIds = Array.from(new Set(messages.map(m => m.senderId).filter(Boolean)));
        let userMap = new Map<string, User>();
        if (senderIds.length > 0) {
            const users = await AppDataSource.getRepository(User).find({
                where: { id: In(senderIds) }
            });
            userMap = new Map(users.map(u => [u.id, u]));
        }

        // Map messages to include decrypted content and senderName
        const mappedMessages = messages.map(({ content, timestamp, senderId }) => ({
            informationHash: informationHash.decrypt(content),
            senderName: userMap.get(senderId ?? "")?.name ?? null,
            timestamp
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
                profilePictureURL: userChat.user.profilePictureURL, // added profile picture
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

export async function searchSimilarUsersWithoutTheChatMember(query: string, pageNumber: number, excludeUserIds: string[]): Promise<User[] | null> {
    try {
        // Given a part of a name or email, find if it belongs to any user, even if in middle of name or email
        const users = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .skip(pageNumber * USERS_PER_PAGE)
            .take(USERS_PER_PAGE)
            .where("(user.name LIKE :query OR user.id LIKE :query)", { query: `%${query}%` })
            .andWhere("user.id NOT IN (:...excludeUserIds)", { excludeUserIds })
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

export async function getAlphabeticOrderedUsersWithoutTheChatMembers(jump: number, excludeUserIds: string[]): Promise<User[]> {
    try {
        const users = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .orderBy("user.name", "ASC")
            .skip(jump * USERS_PER_PAGE)
            .take(USERS_PER_PAGE)
            .where("user.id NOT IN (:...excludeUserIds)", { excludeUserIds })
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
            profilePictureURL: u.profilePictureURL, // added profile picture to response
            role
        };
    });
}

export async function getGeneralChat(): Promise<Chat> {
  try {
    
    const generalChat = await AppDataSource.getRepository(Chat).findOne({
      where: { chatType: TypeOfChat.GENERAL_CHAT },
    });

    return generalChat!;

  } catch (error) {
    console.error("Error getting general chat", error);
    throw new Error("Error getting general chat");
  }
}


export async function addUserToGeneralChat(userId: string): Promise<void> {
    try {
        const generalChat = await getGeneralChat();

        const existingUserChat = await AppDataSource.getRepository(UserChat).findOne({
            where: {
                userId: userId,
                chatId: generalChat!.id
            }
        });

        if (!existingUserChat) {
            await AppDataSource.getRepository(UserChat).insert({
                userId: userId,
                chatId: generalChat!.id
            });
            console.log(`User ${userId} added to general chat`);

            webSocketEvents.addNewUserToChatRoom(generalChat.id, userId);
        }

    } catch (error) {
        console.error("Error adding user to general chat:", error);
        throw new Error("Failed to add user to general chat");
    }
}
