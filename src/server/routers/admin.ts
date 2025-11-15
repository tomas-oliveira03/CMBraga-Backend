import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import express, { Request, Response } from "express";
import { UpdateAdminSchema } from "../schemas/admin";
import { z } from "zod";
import informationHash from "@/lib/information-hash";
import multer from "multer";
import { isValidImageFile } from "@/helpers/storage";
import { updateProfilePicture } from "../services/user";
import { User } from "@/db/entities/User";
import { UserRole } from "@/helpers/types";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const allAdmins = await AppDataSource.getRepository(Admin).find();
        return res.status(200).json(allAdmins);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const adminId = req.params.id;

        const admin = await AppDataSource.getRepository(Admin).findOne({
            where: {
                id: adminId
            }
        });

        if (!admin){
            return res.status(404).json({ message: "Admin not found" })
        }

        return res.status(200).json(admin);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put('/:id', authenticate, authorize(UserRole.ADMIN), upload.single('file'), async (req: Request, res: Response) => {
    try {
        const adminId = req.user!.userId
        const validatedData = UpdateAdminSchema.parse(req.body);
        
        const admin = await AppDataSource.getRepository(Admin).findOne({
            where: { id: adminId }
        })
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const adminData = { 
            ...validatedData,
            profilePictureURL: admin.profilePictureURL
        }

        if (req.file){
            if (!isValidImageFile(req.file)){
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            adminData.profilePictureURL = await updateProfilePicture(admin.profilePictureURL, req.file.buffer);
        }

        const userUpdateData: Partial<User> = {};
        if (validatedData.name) userUpdateData.name = validatedData.name;
        if (req.file) userUpdateData.profilePictureURL = adminData.profilePictureURL;
        const updatedAt = new Date()

        await AppDataSource.transaction(async tx => {
            
            await tx.getRepository(Admin).update(admin.id, {
                ...adminData,
                updatedAt: updatedAt
            })

            // If name or profilePictureURL are updated, the copy in User table also needs to be updated
            if (Object.keys(userUpdateData).length > 0) {
                await tx.getRepository(User).update(
                    { id: admin.email },
                    userUpdateData
                );
            }
        });
        
        return res.status(200).json({ 
            id: adminId,
            name: adminData.name,
            profilePictureURL: req.file ? adminData.profilePictureURL : undefined,
            updatedAt: updatedAt
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
