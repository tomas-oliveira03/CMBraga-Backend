import { AppDataSource } from "@/db";
import { Issue } from "@/db/entities/Issue";
import express, { Request, Response } from "express";
import { CreateIssueSchema, UpdateIssueSchema } from "../schemas/issue";
import { z } from "zod";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Instructor } from "@/db/entities/Instructor";
import multer from 'multer';
import { uploadImagesBuffer } from "../services/cloud";
import { areValidImageFiles } from "@/helpers/storage";
import { createNotificationForUser } from "../services/notification";
import { UserNotificationType, UserRole } from "@/helpers/types";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const allIssues = await AppDataSource.getRepository(Issue).find({
            order: {
                createdAt: 'ASC'
            },
            relations: {
                instructor: true,
                activitySession: {
                    route: true
                }
            }
        });
        const issuesPayload = allIssues.map(issue => ({
            id: issue.id,
            description: issue.description,
            imageURLs: issue.imageURLs,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            resolvedAt: issue.resolvedAt,
            instructor: {
                id: issue.instructor.id,
                name: issue.instructor.name,
                profilePictureURL: issue.instructor.profilePictureURL
            },
            activitySession: {
                id: issue.activitySession.id,
                type: issue.activitySession.type,
                routeName: issue.activitySession.route.name,
                scheduledAt: issue.activitySession.scheduledAt
            }
        }));

        return res.status(200).json(issuesPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;

        const issue = await AppDataSource.getRepository(Issue).findOne({
            where: { id: issueId},
            relations: {
                instructor: true,
                activitySession: {
                    route: true
                }
            }
        });

        if (!issue){
            return res.status(404).json({ message: "Issue not found" })
        }

        return res.status(200).json({
            id: issue.id,
            description: issue.description,
            imageURLs: issue.imageURLs,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            resolvedAt: issue.resolvedAt,
            instructor: {
                id: issue.instructor.id,
                name: issue.instructor.name,
                profilePictureURL: issue.instructor.profilePictureURL
            },
            activitySession: {
                id: issue.activitySession.id,
                type: issue.activitySession.type,
                routeName: issue.activitySession.route.name,
                scheduledAt: issue.activitySession.scheduledAt
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/', authenticate, authorize(UserRole.INSTRUCTOR), upload.array('files'), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateIssueSchema.parse(req.body);

        const files = (req.files as Express.Multer.File[]);
        const isValidFiles = areValidImageFiles(files)

        if(!isValidFiles){
            return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: validatedData.activitySessionId },
            relations: {
                route: true
            }
        });

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { id: validatedData.instructorId }
        });

        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        
    
        let issueId: string = '';
        await AppDataSource.transaction(async tx => {

            const issue = await tx.getRepository(Issue).insert(validatedData);
            issueId = issue.identifiers[0]?.id
            
            const imagesToUploadData = files.map((file, index) => ({
                buffer: file.buffer,
                fileName: `${issueId}-${index + 1}`
            }));

            const cloudStoredImagesURLs = await uploadImagesBuffer(imagesToUploadData, "issues");

            await tx.getRepository(Issue).update(
                { id: issueId },
                { imageURLs: cloudStoredImagesURLs }
            )
        });

        createNotificationForUser({
            type: UserNotificationType.NEW_ACTIVITY_ISSUE,
            issueId: issueId,
            activitySession: {
                id: activitySession.id,
                type: activitySession.type,
                routeName: activitySession.route.name,
                scheduledAt: activitySession.scheduledAt ,
            }
        })

        return res.status(201).json({ message: "Issue created successfully" });

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


// Toggle issue between read and not read
router.put('/resolve/toggle/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;
        
        const issue = await AppDataSource.getRepository(Issue).findOne({
            where: { id: issueId }
        });

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        const date = new Date();
        let resolvedAt: Date | null = date;

        if(issue.resolvedAt){
            resolvedAt = null;
        }

        await AppDataSource.getRepository(Issue).update(issue.id, {
            updatedAt: date,
            resolvedAt: resolvedAt
        });
        
        return res.status(200).json({ message: "Issue updated successfully" });

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
