"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfChatAlreadyExists = checkIfChatAlreadyExists;
exports.checkIfUserInChat = checkIfUserInChat;
exports.checkIfUserExists = checkIfUserExists;
exports.checkIfChatExists = checkIfChatExists;
exports.getMessagesFromChat = getMessagesFromChat;
exports.searchSimilarUsers = searchSimilarUsers;
const db_1 = require("../../db");
const Message_1 = require("../../db/entities/Message");
const User_1 = require("../../db/entities/User");
const UserChat_1 = require("../../db/entities/UserChat");
const Chat_1 = require("../../db/entities/Chat");
const MESSAGES_PER_PAGE = 20;
async function checkIfChatAlreadyExists(usersIDs) {
    try {
        const starting_user = usersIDs[0];
        const chatUserChats = await db_1.AppDataSource.getRepository(UserChat_1.UserChat)
            .createQueryBuilder("userChat")
            .innerJoinAndSelect("userChat.chat", "chat")
            .where("userChat.userId = :starting_user", { starting_user })
            .getMany();
        for (const userChat of chatUserChats) {
            const chatId = userChat.chatId;
            const members = await db_1.AppDataSource.getRepository(UserChat_1.UserChat)
                .find({ where: { chatId } });
            const memberIds = members.map(m => m.userId);
            if (memberIds.length === usersIDs.length && usersIDs.every(id => memberIds.includes(id))) {
                return userChat.chat;
            }
        }
        return null;
    }
    catch (error) {
        console.error("Error checking if chat already exists:", error);
        throw new Error("Failed to check if chat exists");
    }
}
async function checkIfUserInChat(email, chatId) {
    try {
        const userChat = await db_1.AppDataSource.getRepository(UserChat_1.UserChat)
            .findOne({
            where: {
                userId: email,
                chatId: chatId
            }
        });
        return userChat !== null;
    }
    catch (error) {
        console.error("Error checking if user is in chat:", error);
        throw new Error("Failed to check if user is in chat");
    }
}
async function checkIfUserExists(userId) {
    try {
        const user = await db_1.AppDataSource.getRepository(User_1.User)
            .findOne({ where: { id: userId } });
        return user !== null;
    }
    catch (error) {
        console.error("Error checking if user exists:", error);
        throw new Error("Failed to check if user exists");
    }
}
async function checkIfChatExists(chatId) {
    try {
        const chat = await db_1.AppDataSource.getRepository(Chat_1.Chat)
            .findOne({ where: { id: chatId } });
        return chat !== null;
    }
    catch (error) {
        console.error("Error checking if chat exists:", error);
        throw new Error("Failed to check if chat exists");
    }
}
async function getMessagesFromChat(chatId, page) {
    try {
        const query = db_1.AppDataSource.getRepository(Message_1.Message)
            .createQueryBuilder("message")
            .where("message.chatId = :chatId", { chatId })
            .orderBy("message.timestamp", "DESC");
        if (page > 0) {
            query.skip((page - 1) * MESSAGES_PER_PAGE).take(MESSAGES_PER_PAGE);
        }
        else {
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
            const chat = await db_1.AppDataSource.getRepository(Chat_1.Chat)
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
    }
    catch (error) {
        console.error("Error retrieving messages from chat:", error);
        throw new Error("Failed to retrieve messages from chat");
    }
}
async function searchSimilarUsers(query) {
    try {
        // Given a part of a name or email, find if it belongs to any user, even if in middle of name or email
        const users = await db_1.AppDataSource.getRepository(User_1.User)
            .createQueryBuilder("user")
            .where("user.name LIKE :query OR user.id LIKE :query", { query: `%${query}%` })
            .getMany();
        return users;
    }
    catch (error) {
        console.error("Error searching for users:", error);
        throw new Error("Failed to search for users");
    }
}
