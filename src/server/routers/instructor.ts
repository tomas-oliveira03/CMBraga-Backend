import { AppDataSource } from "@/db";
import { Instructor } from "@/db/entities/Instructor";
import express, { Request, Response } from "express";
import { UpdateInstructorSchema } from "@/server/schemas/instructor";
import informationHash from "@/lib/information-hash";
import z from "zod";
import multer from "multer";
import { isValidImageFile } from "@/helpers/storage";
import { updateProfilePicture } from "../services/user";
import { User } from "@/db/entities/User";
import { ActivityStatusType } from "@/helpers/types";
import { IsNull } from "typeorm";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req: Request, res: Response) => {
    try {
        const allInstructors = await AppDataSource.getRepository(Instructor).find();
        return res.status(200).json(allInstructors);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', async (req: Request, res: Response) => {
    try {
        const instructorId = req.params.id;
        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: {
                id: instructorId
            }
        });
        if (!instructor){
            return res.status(404).json({ message: "Instructor not found" })
        }
        return res.status(200).json(instructor);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put('/:id', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const instructorId = req.params.id;
        const validatedData = UpdateInstructorSchema.parse(req.body);
        
        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { id: instructorId }
        })
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        const instructorData = { 
            ...validatedData,
            profilePictureURL: instructor.profilePictureURL
        }

        if (validatedData.password) {
            instructorData.password = informationHash.encrypt(validatedData.password);
        }

        if (req.file){
            if (!isValidImageFile(req.file)){
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            instructorData.profilePictureURL = await updateProfilePicture(instructor.profilePictureURL, req.file.buffer);
        }

        const userUpdateData: Partial<User> = {};
        if (validatedData.name) userUpdateData.name = validatedData.name;
        if (req.file) userUpdateData.profilePictureURL = instructorData.profilePictureURL;
        const updatedAt = new Date()
        
        await AppDataSource.transaction(async tx => {
            
            await tx.getRepository(Instructor).update(instructor.id, {
                ...instructorData,
                updatedAt: updatedAt
            })

            // If name or profilePictureURL are updated, the copy in User table also needs to be updated
            if (Object.keys(userUpdateData).length > 0) {
                await tx.getRepository(User).update(
                    { id: instructor.email },
                    userUpdateData
                );
            }
        });
        
        return res.status(200).json({ 
            id: instructorId,
            name: instructorData.name,
            profilePictureURL: req.file ? instructorData.profilePictureURL : undefined,
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


// Get all instructor ongoing and upcoming activities
router.get('/next-activities/:id', async (req: Request, res: Response) => {
    try {
        const instructorId = req.params.id;
        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: {
                id: instructorId,
                instructorActivitySessions: {
                    activitySession: {
                        finishedAt: IsNull()
                    }
                }
            },
            relations: {
                instructorActivitySessions: {
                    activitySession: {
                        route: true
                    }
                }
            }
        });
        if (!instructor){
            return res.status(404).json({ message: "Instructor not found" })
        }

        const finalPayload = instructor.instructorActivitySessions.map(activitySessionLink => {
            const activitySession = activitySessionLink.activitySession;
            const activityStatusType = activitySession.startedAt 
                ? ActivityStatusType.ONGOING 
                : ActivityStatusType.UPCOMING;

            return {
                status: activityStatusType,
                activity: {
                    id: activitySession.id,
                    type: activitySession.type,
                    mode: activitySession.mode,
                    scheduledAt: activitySession.scheduledAt,
                    ...(activitySession.startedAt && { startedAt: activitySession.startedAt }),
                    createdAt: activitySession.createdAt,
                    updatedAt: activitySession.updatedAt
                },
                route: {
                    id: activitySession.route.id,
                    name: activitySession.route.name,
                }
            };
        })

        return res.status(200).json(finalPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;