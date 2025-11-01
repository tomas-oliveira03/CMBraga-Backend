import { AppDataSource } from "@/db";
import { Parent } from "@/db/entities/Parent";
import express, { Request, Response } from "express";
import { UpdateParentSchema } from "../schemas/parent";
import { z } from "zod";
import informationHash from "@/lib/information-hash";
import multer from "multer";
import { updateProfilePicture } from "../services/user";
import { isValidImageFile } from "@/helpers/storage";
import { User } from "@/db/entities/User";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req: Request, res: Response) => {
    try {
        const allParents = await AppDataSource.getRepository(Parent).find();
        return res.status(200).json(allParents);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', async (req: Request, res: Response) => {
    try {
        const parentId = req.params.id;

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: {
                id: parentId
            }
        });

        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        return res.status(200).json(parent);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put('/:id', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const parentId = req.params.id;
        const validatedData = UpdateParentSchema.parse(req.body);
        
        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        const parentData = { 
            ...validatedData,
            profilePictureURL: parent.profilePictureURL
        }

        if (validatedData.password) {
            parentData.password = informationHash.encrypt(validatedData.password);
        }

        if (req.file){
            if (!isValidImageFile(req.file)){
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            parentData.profilePictureURL = await updateProfilePicture(parent.profilePictureURL, req.file.buffer);
        }

        const userUpdateData: Partial<User> = {};
        if (validatedData.name) userUpdateData.name = validatedData.name;
        if (req.file) userUpdateData.profilePictureURL = parentData.profilePictureURL;
        const updatedAt = new Date()

        await AppDataSource.transaction(async tx => {

            await AppDataSource.getRepository(Parent).update(parent.id, {
                ...parentData,
                updatedAt: updatedAt
            });

            // If name or profilePictureURL are updated, the copy in User table also needs to be updated
            if (Object.keys(userUpdateData).length > 0) {
                await tx.getRepository(User).update(
                    { id: parent.email },
                    userUpdateData
                );
            }
        });
        
        return res.status(200).json({ 
            id: parentId,
            name: parentData.name,
            profilePictureURL: req.file ? parentData.profilePictureURL : undefined,
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
