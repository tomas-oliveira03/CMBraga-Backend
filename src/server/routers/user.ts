import express, { Request, Response } from "express";
import { getAlphabeticOrderedUsers, searchSimilarUsers, normalizeUsers } from "../services/comms";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import { UserRole } from "@/helpers/types";

const router = express.Router();

router.get("/search",  async (req: Request, res: Response) => {
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


router.get('/:id', async (req: Request, res: Response) => {
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


export default router;
