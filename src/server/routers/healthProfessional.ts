import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { z } from "zod";
import { UpdateHealthProfessionalSchema } from "../schemas/healthProfessional";
import informationHash from "@/lib/information-hash";
import multer from "multer";
import { isValidImageFile } from "@/helpers/storage";
import { updateProfilePicture } from "../services/user";
import { User } from "@/db/entities/User";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req: Request, res: Response) => {
    try {
        const allHealthProfessionals = await AppDataSource.getRepository(HealthProfessional).find();
        return res.status(200).json(allHealthProfessionals);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', async (req: Request, res: Response) => {
    try {
        const healthProfessionalId = req.params.id;

        const healthProfessional = await AppDataSource.getRepository(HealthProfessional).findOne({
            where: {
                id: healthProfessionalId
            }
        });

        if (!healthProfessional){
            return res.status(404).json({ message: "Health professional not found" })
        }

        return res.status(200).json(healthProfessional);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put('/:id', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const healthProfessionalId = req.params.id;
        const validatedData = UpdateHealthProfessionalSchema.parse(req.body);
        
        const healthProfessional = await AppDataSource.getRepository(HealthProfessional).findOne({
            where: { id: healthProfessionalId }
        })
        if (!healthProfessional) {
            return res.status(404).json({ message: "Health Professional not found" });
        }

        const healthProfessionalData = { 
            ...validatedData,
            profilePictureURL: healthProfessional.profilePictureURL
        }

        if (validatedData.password) {
            healthProfessionalData.password = informationHash.encrypt(validatedData.password);
        }

        if (req.file){
            if (!isValidImageFile(req.file)){
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            healthProfessionalData.profilePictureURL = await updateProfilePicture(healthProfessional.profilePictureURL, req.file.buffer);
        }

        const userUpdateData: Partial<User> = {};
        if (validatedData.name) userUpdateData.name = validatedData.name;
        if (req.file) userUpdateData.profilePictureURL = healthProfessionalData.profilePictureURL;
        const updatedAt = new Date()
        
        await AppDataSource.transaction(async tx => {

            await tx.getRepository(HealthProfessional).update(healthProfessional.id, {
                ...healthProfessionalData,
                updatedAt: updatedAt
            })

            // If name or profilePictureURL are updated, the copy in User table also needs to be updated
            if (Object.keys(userUpdateData).length > 0) {
                await tx.getRepository(User).update(
                    { id: healthProfessional.email },
                    userUpdateData
                );
            }
        });
        
        return res.status(200).json({ 
            id: healthProfessionalId,
            name: healthProfessionalData.name,
            profilePictureURL: req.file ? healthProfessionalData.profilePictureURL : undefined,
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