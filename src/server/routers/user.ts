import express, { Request, Response } from "express";
import { getAlphabeticOrderedUsers, searchSimilarUsers, normalizeUsers, searchSimilarUsersWithoutTheChatMember, getAlphabeticOrderedUsersWithoutTheChatMembers } from "../services/comms";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import { UserRole } from "@/helpers/types";
import { authenticate } from "../middleware/auth";
import { checkIfChatAlreadyExists } from "../services/comms";
import { UserChat } from "@/db/entities/UserChat";
import passwordHash from "@/lib/password-hash";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { Instructor } from "@/db/entities/Instructor";
import { Parent } from "@/db/entities/Parent";
import { Admin } from "@/db/entities/Admin";
import { resetPasswordEmail, verifyToken } from "../services/email";
import path from "path";
import { envs } from "@/config";

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


// Change user password using a token
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword || typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ message: "Old password and new password are required" });
        }

        const user = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.admin", "admin")
            .leftJoinAndSelect("user.instructor", "instructor")
            .leftJoinAndSelect("user.parent", "parent")
            .leftJoinAndSelect("user.healthProfessional", "hp")
            .where("user.id = :id", { id: req.user!.email })
            .addSelect("admin.password")
            .addSelect("instructor.password")
            .addSelect("parent.password")
            .addSelect("hp.password")
            .getOne();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const hashedNewPassword = await passwordHash.hash(newPassword);
        if (user.admin && user.admin.activatedAt && await passwordHash.verify(oldPassword, user.admin.password)) {
            await AppDataSource.getRepository(Admin).update({ id: user.admin.id }, { password: hashedNewPassword });
        }
        else if (user.instructor && user.instructor.activatedAt && await passwordHash.verify(oldPassword, user.instructor.password)) {
            await AppDataSource.getRepository(Instructor).update({ id: user.instructor.id }, { password: hashedNewPassword });
        }
        else if (user.parent && user.parent.activatedAt && await passwordHash.verify(oldPassword, user.parent.password)) {
            await AppDataSource.getRepository(Parent).update({ id: user.parent.id }, { password: hashedNewPassword });
        }
        else if (user.healthProfessional && user.healthProfessional.activatedAt && await passwordHash.verify(oldPassword, user.healthProfessional.password)) {
            await AppDataSource.getRepository(HealthProfessional).update({ id: user.healthProfessional.id }, { password: hashedNewPassword });
        }
        else {
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        return res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Set user password
router.post('/set-password', async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: "Token and password are required" });
        }

        const decoded = verifyToken(token);
        const email = decoded.userEmail;

        const hashedPassword = await passwordHash.hash(password);

        const user = await AppDataSource.getRepository(User).findOne({
            where: { id: email },
            select: {
                adminId: true,
                parentId: true,
                healthProfessionalId: true,
                instructorId: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (user.adminId) {
            await AppDataSource.createQueryBuilder().update(Admin)
            .set({
                    password: hashedPassword,
                    updatedAt: new Date(),
                    activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
            })
            .where("id = :id", { id: user.adminId })
            .execute();
            
        } else if (user.instructorId) {
            await AppDataSource.createQueryBuilder().update(Instructor)
            .set({
                    password: hashedPassword,
                    updatedAt: new Date(),
                    activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
            })
            .where("id = :id", { id: user.instructorId })
            .execute();

        } else if (user.parentId) {
            await AppDataSource.createQueryBuilder().update(Parent)
                .set({
                    password: hashedPassword,
                    updatedAt: new Date(),
                    activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
                })
                .where("id = :id", { id: user.parentId })
                .execute();

        } else if (user.healthProfessionalId) {
            await AppDataSource.createQueryBuilder().update(HealthProfessional)
                .set({
                    password: hashedPassword,
                    updatedAt: new Date(),
                    activatedAt: () => `CASE WHEN "activated_at" IS NULL THEN NOW() ELSE "activated_at" END`,
                })
                .where("id = :id", { id: user.healthProfessionalId })
                .execute();

        } else {
            return res.status(404).json({ message: "User role not found" });
        }
    
        return res.status(200).json({ message: "Password set successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Recover password (send reset email)
router.post('/recover-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await AppDataSource.getRepository(User).findOne({
            where: { id: email }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await resetPasswordEmail(email, user.name);

        return res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Redirect to app set password scheme or to download page
router.get("/set-password-redirect/:token", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const appName = envs.APP_NAME;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <title>MoveKids</title>
            </head>
            <body>
            <script>
                const token = "${token}";
                const appName = "${appName}";

                if (token) {
                    window.location.href = appName + "://set-password?token=" + token;
                }

                setTimeout(() => {
                    window.location.href = "https://${appName}.pt/download";
                }, 1200);
            </script>

            <h2>A abrir a app MoveKids…</h2>
            <p>Se nada acontecer, será redirecionado em breve.</p>
            </body>
            </html>
        `;

        return res.send(html);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
