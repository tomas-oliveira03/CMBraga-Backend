import express, { Request, Response } from "express";
import { getAlphabeticOrderedUsers, searchSimilarUsers, normalizeUsers, searchSimilarUsersWithoutTheChatMember, getAlphabeticOrderedUsersWithoutTheChatMembers } from "../services/comms";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import { UserRole } from "@/helpers/types";
import { authenticate } from "../middleware/auth";
import { checkIfChatAlreadyExists } from "../services/comms";
import { UserChat } from "@/db/entities/UserChat";

const router = express.Router();

// Search for users by a query string
router.get("/search", authenticate, async (req: Request, res: Response) => {
    try {
        const rawQuery = req.query.query;
        const rawPage = req.query.page;
        const newChatFlag = req.query.newchat;
        const pageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
        let pageNumber = 0;
        if (pageParam !== undefined) {
            const parsed = parseInt(pageParam as string, 10);
            if (isNaN(parsed) || parsed < 0) {
                return res.status(400).json({ message: "Invalid page parameter. Page must be an integer >= 0" });
            }
            pageNumber = parsed;
        }

        const queryParam = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
        const userId = req.user?.email;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (newChatFlag === "1") {
            let users;
            if (queryParam === undefined) {
                users = await getAlphabeticOrderedUsers(pageNumber);
            } else if (typeof queryParam === "string") {
                const lowercaseQuery = queryParam.toLowerCase();
                users = await searchSimilarUsers(lowercaseQuery, pageNumber);
            } else {
                return res.status(400).json({ message: "Missing or invalid query parameter" });
            }
            if (!users) return res.status(200).json([]);

            users = users.filter(u => u.id !== userId);

            const filteredUsers: typeof users = [];
            for (const u of users) {
                const chat = await checkIfChatAlreadyExists([userId, u.id]);
                if (!chat) {
                    filteredUsers.push(u);
                } else if (chat.chatType !== "individual_chat") {
                    filteredUsers.push(u);
                }
            }
            return res.status(200).json(normalizeUsers(filteredUsers));
        }

        if (queryParam === undefined) {
            const users = await getAlphabeticOrderedUsers(pageNumber);
            return res.status(200).json(normalizeUsers(users));
        }

        if (typeof queryParam !== "string") {
            return res.status(400).json({ message: "Missing or invalid query parameter" });
        }

        const query = queryParam;
        const lowercaseQuery = query.toLowerCase();
        const querysize = lowercaseQuery.length;
        const users = await searchSimilarUsers(lowercaseQuery, pageNumber);
        if (!users) {
            return res.status(200).json([]);
        }
        return res.status(200).json(normalizeUsers(users));
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        const user = await AppDataSource.getRepository(User).findOne({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                profilePictureURL: true,
                adminId: true,
                instructorId: true,
                healthProfessionalId: true,
                parentId: true
            }
        });
        if (!user){
            return res.status(404).json({ message: "User not found" })
        }

        let userRole = UserRole.ADMIN
        let clientId = user.adminId
        if (user.instructorId) { userRole = UserRole.INSTRUCTOR, clientId=user.instructorId }
        else if (user.healthProfessionalId) { userRole = UserRole.HEALTH_PROFESSIONAL, clientId=user.healthProfessionalId }
        else if (user.parentId) { userRole = UserRole.PARENT, clientId=user.parentId }

        return res.status(200).json({ 
            id: clientId,
            email: user.id,
            name: user.name,
            profilePictureURL: user.profilePictureURL,
            role: userRole
         });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

// Only show users that arent in the conversation, search format same as "/search" endpoint, verify user is part of conversation
router.get("/:conversationId/search", authenticate, async (req: Request, res: Response) => {
    try {
        const rawQuery = req.query.query;
        const rawPage = req.query.page;
        const pageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
        let pageNumber = 0;
        if (pageParam !== undefined) {
            const parsed = parseInt(pageParam as string, 10);
            if (isNaN(parsed) || parsed < 0) {
                return res.status(400).json({ message: "Invalid page parameter. Page must be an integer >= 0" });
            }
            pageNumber = parsed;
        }
        const queryParam = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
        const conversationId = req.params.conversationId;
        const userId = req.user?.email;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!conversationId) {
            return res.status(400).json({ message: "Missing conversationId parameter" });
        }
        let users;
        const inChatUsers = await AppDataSource.getRepository(UserChat).find({
            where: {
                chatId: conversationId
            }
        });

        if (!inChatUsers.map(uc => uc.userId).includes(userId)) {
            return res.status(403).json({ message: "User not part of the conversation" });
        }

        if (queryParam === undefined) {
            users = await getAlphabeticOrderedUsersWithoutTheChatMembers(pageNumber, inChatUsers.map(uc => uc.userId));
        } else if (typeof queryParam === "string") {
            const lowercaseQuery = queryParam.toLowerCase();
            users = await searchSimilarUsersWithoutTheChatMember(lowercaseQuery, pageNumber, inChatUsers.map(uc => uc.userId));
        } else {
            return res.status(400).json({ message: "Missing or invalid query parameter" });
        }
        if (!users) return res.status(200).json([]);
        users = users.filter(u => u.id !== userId);
        return res.status(200).json(normalizeUsers(users));
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;
