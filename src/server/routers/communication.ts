import express, { Request, Response } from "express";
import { AppDataSource } from "@/db";
import { CommunicationSchema, MessageSchema } from "../schemas/communication";
import { z } from "zod";
import { webSocketManager } from "../services/websocket";
import { authenticate, authorize } from "@/server/middleware/auth";
import { NotificationType } from "@/helpers/types";

import { Message } from "@/db/entities/Message";
import { User } from "@/db/entities/User";
import { UserChat } from "@/db/entities/UserChat";
import { Chat } from "@/db/entities/Chat";
import { TypeOfChat } from "@/helpers/types";
import multer from "multer";
import { checkIfChatAlreadyExists, checkIfUserInChat, checkIfUserExists, checkIfChatExists, getMessagesFromChat, getChat, checkIfEmailsExist } from "../services/comms";
import { webSocketEvents } from "../services/websocket-events";
import informationHash from "@/lib/information-hash";
import { isValidImageFile, GROUP_DEFAULT_PROFILE_PICTURE } from "@/helpers/storage";
import { uploadImageBuffer } from "../services/cloud";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single('file'), authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userEmail = req.user.email;

        // parse with new schema: members is an array of email strings
        const parsed = CommunicationSchema.parse(req.body);

        // sanitize members: remove any occurrence of the authenticated user's email and deduplicate
        const rawMembers: string[] = Array.isArray(parsed.members) ? parsed.members : [];
        const filtered = rawMembers.filter(m => typeof m === "string" && m.trim().length > 0 && m !== userEmail);
        const uniqueMembers = Array.from(new Set(filtered));

        if (uniqueMembers.length < 1) {
            return res.status(400).json({ message: "At least one member (other than the authenticated user) is required to create a conversation" });
        }

        // determine total members including the authenticated user
        const members_emails = [...uniqueMembers, userEmail];
        const num_members = members_emails.length;

        // group chats (more than 2 people) require a chatName
        if (num_members > 2 && !parsed.chatName) {
            return res.status(400).json({ message: "A chat name must be provided for group chats" });
        }

        const allExist = await checkIfEmailsExist(members_emails);
        if (!allExist) {
            return res.status(400).json({ message: "One or more specified users do not exist" });
        }

        const exists = await checkIfChatAlreadyExists(members_emails);
        if (exists !== null) {
            return res.status(400).json({ message: "Conversation already exists", chatId: exists.id });
        }

        const newChat: {
                    chatType: TypeOfChat;
                    chatName: string | null;
                    destinatairePhoto?: string;
                    messages: any[];
                } = {
                    chatType: num_members > 2 ? TypeOfChat.GROUP_CHAT : TypeOfChat.INDIVIDUAL_CHAT,
                    chatName: num_members > 2 ? (parsed.chatName ?? null) : null,
                    destinatairePhoto: undefined,
                    messages: [],
                };

        if (num_members > 2 && req.file) {
            if (!isValidImageFile(req.file)){
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            newChat.destinatairePhoto = await uploadImageBuffer(req.file.buffer, "group-picture", "groups");
        } 
        else if (!req.file && num_members > 2){
            newChat.destinatairePhoto = GROUP_DEFAULT_PROFILE_PICTURE;
        }

        let conversationId: string | undefined;
        await AppDataSource.transaction(async tx => {

            const chat = await tx.getRepository(Chat).insert(newChat);
            conversationId = chat.identifiers[0]?.id

            const userChatEntries = members_emails.map(member => ({
                userId: member,
                chatId: conversationId,
            }));

            // Create new chat room in WebSocket manager
            webSocketEvents.addNewChatRoom(conversationId!, members_emails);

            await tx.getRepository(UserChat).insert(userChatEntries);
        });

        return res.status(201).json({ message: "Conversation created successfully", chatId: conversationId });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

router.post("/chats/:conversationId/members", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.email;
        const { conversationId } = req.params;

        const newMembers = Array.isArray(req.body?.newMembers) ? req.body.newMembers
            : Array.isArray(req.body?.newmembers) ? req.body.newmembers
            : [];

        if (!Array.isArray(newMembers) || newMembers.length === 0) {
            return res.status(400).json({ message: "newMembers must be a non-empty array of email strings" });
        }
        
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }
        const chat = await getChat(conversationId);
        if (!chat) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        if (chat.chatType === TypeOfChat.INDIVIDUAL_CHAT) {
            return res.status(400).json({ message: "Cannot add members to an individual chat" });
        }
        const isUserInChat = await checkIfUserInChat(userId, conversationId);
        if (isUserInChat) {
            return res.status(403).json({ message: "You are a member of this conversation" });
        }
        const filteredNewMembers = Array.isArray(newMembers) ? newMembers.filter((email: any) => typeof email === "string" && email.trim().length > 0) : [];
        if (filteredNewMembers.length === 0) {
            return res.status(400).json({ message: "No valid new members provided" });
        }

        const allExist = await checkIfEmailsExist(filteredNewMembers);
        if (!allExist) {
            return res.status(400).json({ message: "One or more specified users do not exist" });
        }
        
        const newUserChats = filteredNewMembers.map((email: string) => ({
            userId: email,
            chatId: conversationId,
        }));
        await AppDataSource.getRepository(UserChat).insert(newUserChats);

        webSocketEvents.addNewUserToChatRoom(conversationId, userId);
        return res.status(200).json({ message: "New members added successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

// Me as a user leaving a group chat
router.post("/chats/:conversationId/leave", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.email;
        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }
        const chat = await getChat(conversationId);
        if (!chat) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        if (chat.chatType === TypeOfChat.INDIVIDUAL_CHAT) {
            return res.status(400).json({ message: "Cannot leave an individual chat" });
        }
        const isUserInChat = await checkIfUserInChat(userId, conversationId);
        if (isUserInChat) {
            return res.status(403).json({ message: "You are a member of this conversation" });
        }
        await AppDataSource.getRepository(UserChat).delete({ userId, chatId: conversationId});

        webSocketEvents.removeUserFromChatRoom(conversationId, userId);

        return res.status(200).json({ message: "You have left the group chat successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post("/messages/:conversationId", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const senderId = req.user.email;
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }

        const parsed = MessageSchema.parse(req.body);
        const sender_id = senderId;

        const userExists = await checkIfUserExists(sender_id);
        if (!userExists) {
            return res.status(400).json({ message: "Sender does not exist" });
        }

        const chatExists = await getChat(conversationId)
        if (!chatExists) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const isUserInChat = await checkIfUserInChat(sender_id, conversationId);
        if (!isUserInChat) {
            return res.status(403).json({ message: "Sender is not a member of the conversation" });
        }

        const newMessage = {
            content: informationHash.encrypt(parsed.content),
            timestamp: new Date(),
            chatId: conversationId,
            senderId: sender_id
        };

        await AppDataSource.getRepository(Message).insert(newMessage);

        const usersThanThenSender = await AppDataSource.getRepository(UserChat)
            .find({ where: { chatId: conversationId } });

        for (const userChat of usersThanThenSender) {
            if (userChat.userId !== sender_id) {
                await AppDataSource.getRepository(UserChat).update(
                    { chatId: conversationId, userId: userChat.userId },
                    { seen: false }
                );
            }
        }

        webSocketEvents.sendMessageToChatRoom(conversationId, chatExists.chatType, chatExists.chatName, sender_id, parsed.content);
        
        return res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get("/chat/:conversationId", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const senderId = req.user.email;
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }

        const validation = z.string().uuid().safeParse(conversationId);
        if (!validation.success) {
            return res.status(400).json({ message: "Invalid conversationId: must be a valid UUID" });
        }

        const isInChat = await checkIfUserInChat(senderId, conversationId);
        if (!isInChat) {
            return res.status(403).json({ message: "Forbidden: You are not a member of this conversation" });
        }

        const jump = parseInt(req.query.jump as string) || 0;
        const chatData = await getMessagesFromChat(conversationId, jump);

        const chatExists = await getChat(conversationId);

        if ((!chatData.messages || chatData.messages.length === 0) && !chatExists) {
            return res.status(404).json({ message: "Communication not found" });
        } 
        else if((!chatData.messages || chatData.messages.length === 0) && chatExists){
            return res.status(200).json({ members: chatData.members, messages: [] });
        }

        await AppDataSource.getRepository(UserChat).update(
            { chatId: conversationId, userId: senderId },
            { seen: true }
        );

        if (jump === 0 && chatData.members) {
            return res.status(200).json({ members: chatData.members, messages: chatData.messages });
        }

        return res.status(200).json({ messages: chatData.messages });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get("/my-chats", authenticate, async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.user.email;
        const rawPage = req.query.page;
        let page = 1;
        if (rawPage !== undefined) {
            const parsed = parseInt(rawPage as string, 10);
            if (!isNaN(parsed) && parsed >= 0) page = parsed;
        }
        const limit = 10;

        const userExists = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        const chats = await AppDataSource.getRepository(Chat)
            .createQueryBuilder("chat")
            .leftJoinAndSelect("chat.messages", "message")
            .innerJoin("chat.userChat", "userChat")
            .where("userChat.userId = :userId", { userId })
            .orderBy("message.timestamp", "DESC")
            .addOrderBy("chat.id", "ASC")
            .getMany();

        const sortedChats = await Promise.all(
            chats.map(async chat => {
                const mostRecentMessage = chat.messages?.[0];

                // decrypt message content if present
                const messageContent = mostRecentMessage ? informationHash.decrypt(mostRecentMessage.content) : null;

                // fetch sender name if senderId exists
                let senderName: string | null = null;
                if (mostRecentMessage?.senderId) {
                    const senderUser = await AppDataSource.getRepository(User).findOne({
                        where: { id: mostRecentMessage.senderId },
                        select: { name: true }
                    });
                    senderName = senderUser ? senderUser.name : null;
                }

                const members = await AppDataSource.getRepository(UserChat)
                    .createQueryBuilder("userChat")
                    .innerJoinAndSelect("userChat.user", "user")
                    .where("userChat.chatId = :chatId", { chatId: chat.id })
                    .andWhere("userChat.userId != :userId", { userId })
                    .getMany();

                const memberDetails = members.map(member => ({
                    name: member.user.name,
                    email: member.user.id,
                    profilePictureURL: member.user.profilePictureURL
                }));

                const currentUserChat = await AppDataSource.getRepository(UserChat).findOne({
                    where: { chatId: chat.id, userId }
                });
                const seen = currentUserChat ? currentUserChat.seen : true;

                return {
                    chatId: chat.id,
                    chatType: chat.chatType,
                    chatName: chat.chatName,
                    messageContent: messageContent,
                    senderName: senderName,
                    timestamp: mostRecentMessage?.timestamp || null,
                    members: memberDetails,
                    image: chat.chatType === TypeOfChat.GROUP_CHAT ? chat.destinatairePhoto : null,
                    seen
                };
            })
        );

        const paginatedChats = sortedChats
            .sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                }
                if (a.timestamp) return -1;
                if (b.timestamp) return 1;
                return 0;
            })
            .slice((page - 1) * limit, page * limit);

        return res.status(200).json({ chats: paginatedChats, page });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;