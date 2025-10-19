import { AppDataSource } from "@/db";
import { Issue } from "@/db/entities/Issue";
import express, { Request, Response } from "express";
import { CreateIssueSchema, UpdateIssueSchema } from "../schemas/issue";
import { map, z } from "zod";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Instructor } from "@/db/entities/Instructor";
import multer from 'multer';
import { uploadImagesBuffer } from "../services/cloud";
import { areValidImageFiles } from "@/helpers/storage";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /issue:
 *   get:
 *     summary: Get all issues
 *     description: Returns a list of all issues
 *     tags:
 *       - Issue
 *     responses:
 *       200:
 *         description: List of issues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   activitySessionId:
 *                     type: string
 *                     example: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *                   instructorId:
 *                     type: string
 *                     example: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *                   description:
 *                     type: string
 *                     example: "Criança com dificuldade respiratória durante o percurso"
 *                   imageURLs:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["image1.jpg", "image2.jpg"]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-15T11:00:00.000Z"
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const allIssues = await AppDataSource.getRepository(Issue).find();
        return res.status(200).json(allIssues);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /issue/{id}:
 *   get:
 *     summary: Get issue by ID
 *     description: Returns a single issue by its ID
 *     tags:
 *       - Issue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Issue ID (UUID)
 *     responses:
 *       200:
 *         description: Issue found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 activitySessionId:
 *                   type: string
 *                   example: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *                 instructorId:
 *                   type: string
 *                   example: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *                 description:
 *                   type: string
 *                   example: "Bicicleta com pneu furado"
 *                 imageURLs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["bike_flat_tire.jpg"]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;

        const issue = await AppDataSource.getRepository(Issue).findOne({
            where: { id: issueId}
        });

        if (!issue){
            return res.status(404).json({ message: "Issue not found" })
        }

        return res.status(200).json(issue);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /issue:
 *   post:
 *     summary: Create a new issue
 *     description: Creates a new issue report for an activity session with optional image uploads
 *     tags:
 *       - Issue
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - activitySessionId
 *               - instructorId
 *               - description
 *             properties:
 *               activitySessionId:
 *                 type: string
 *                 example: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *                 description: "Activity session ID where the issue occurred"
 *               instructorId:
 *                 type: string
 *                 example: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *                 description: "ID of the instructor reporting the issue"
 *               description:
 *                 type: string
 *                 example: "Criança caiu e apresenta escoriação no joelho"
 *                 description: "Detailed description of the issue"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: "Optional image files (JPEG, JPG, PNG, WEBP). Can upload none, one, or multiple images."
 *           example:
 *             activitySessionId: "s1t2u3v4-w5x6-7890-yz12-ab1234567890"
 *             instructorId: "i1j2k3l4-m5n6-7890-opqr-st1234567890"
 *             description: "Problema técnico com bicicleta - corrente solta"
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue created successfully"
 *       400:
 *         description: Validation error or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 validation_error:
 *                   value:
 *                     message: "Validation error"
 *                     errors: [{"code": "required", "path": ["description"], "message": "Required"}]
 *                 invalid_file:
 *                   value:
 *                     message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)"
 *       404:
 *         description: Activity session or instructor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 activity_not_found:
 *                   value:
 *                     message: "Activity session not found"
 *                 instructor_not_found:
 *                   value:
 *                     message: "Instructor not found"
 *       500:
 *         description: Internal server error
 */
router.post('/', upload.array('files'), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateIssueSchema.parse(req.body);

        const files = (req.files as Express.Multer.File[]);
        const isValidFiles = areValidImageFiles(files)

        if(!isValidFiles){
            return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: validatedData.activitySessionId }
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
        
        await AppDataSource.transaction(async tx => {

            const issue = await tx.getRepository(Issue).insert(validatedData);
            const issueId = issue.identifiers[0]?.id
            
            const imagesToUploadData = files.map((file, index) => ({
                buffer: file.buffer,
                fileName: `${issueId}-${index + 1}`
            }));

            const cloudStoredImagesURLs = await uploadImagesBuffer(imagesToUploadData, "issues");

            await tx.getRepository(Issue).update(
                { id: issueId },
                { 
                    imageURLs: cloudStoredImagesURLs,
                    updatedAt: new Date()
                }
            )
        });
        
        
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

/**
 * @swagger
 * /issue/{id}:
 *   put:
 *     summary: Update an issue
 *     description: Updates an existing issue
 *     tags:
 *       - Issue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Issue ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Criança recuperou e voltou para casa com os pais"
 *               imageURLs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["updated_photo.jpg"]
 *           example:
 *             description: "Situação resolvida - bicicleta reparada"
 *             imageURLs: ["bike_fixed.jpg"]
 *     responses:
 *       200:
 *         description: Issue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Issue not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;
        const validatedData = UpdateIssueSchema.parse(req.body);
        
        const issue = await AppDataSource.getRepository(Issue).findOne({
            where: { id: issueId }
        });

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }


        await AppDataSource.getRepository(Issue).update(issue.id, {
            ...validatedData,
            updatedAt: new Date()
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

/**
 * @swagger
 * /issue/{id}:
 *   delete:
 *     summary: Delete an issue
 *     description: Deletes an issue by ID
 *     tags:
 *       - Issue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Issue ID (UUID)
 *     responses:
 *       200:
 *         description: Issue deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue deleted successfully"
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Issue not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;
        
        const issue = await AppDataSource.getRepository(Issue).findOne({
            where: { id: issueId }
        });

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        await AppDataSource.getRepository(Issue).delete(issue.id);
        
        return res.status(200).json({ message: "Issue deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
