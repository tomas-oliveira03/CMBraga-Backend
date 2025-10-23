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

/**
 * @swagger
 * /parent:
 *   get:
 *     summary: Get all parents
 *     description: Returns a list of all parents
 *     tags:
 *       - Parent
 *     responses:
 *       200:
 *         description: List of parents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *                   name:
 *                     type: string
 *                     example: "Maria Silva"
 *                   email:
 *                     type: string
 *                     example: "maria.silva@gmail.com"
 *                   phone:
 *                     type: string
 *                     example: "+351 912 345 678"
 *                   address:
 *                     type: string
 *                     example: "Rua das Flores, 123 - Braga"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/parent-1.jpg"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T14:45:30.000Z"
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const allParents = await AppDataSource.getRepository(Parent).find();
        return res.status(200).json(allParents);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /parent/{id}:
 *   get:
 *     summary: Get parent by ID
 *     description: Returns a single parent by their ID
 *     tags:
 *       - Parent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *         description: Parent ID (UUID)
 *     responses:
 *       200:
 *         description: Parent found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *                 name:
 *                   type: string
 *                   example: "João Santos"
 *                 email:
 *                   type: string
 *                   example: "joao.santos@gmail.com"
 *                 phone:
 *                   type: string
 *                   example: "+351 967 890 123"
 *                 address:
 *                   type: string
 *                   example: "Avenida da Liberdade, 456 - Braga"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/parent-2.jpg"
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
 *         description: Parent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent not found"
 */
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


/**
 * @swagger
 * /parent/{id}:
 *   put:
 *     summary: Update a parent
 *     description: Updates an existing parent
 *     tags:
 *       - Parent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "b2c3d4e5-f6g7-8901-bcde-f12345678901"
 *         description: Parent ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@gmail.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Largo do Paço, 321 - Braga"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Profile picture image file (JPEG, JPG, PNG, WEBP)"
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@gmail.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Largo do Paço, 321 - Braga"
 *           example:
 *             name: "Sofia Mendes"
 *             email: "sofia.mendes@gmail.com"
 *             phone: "+351 945 678 901"
 *     responses:
 *       200:
 *         description: Parent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 name:
 *                   type: string
 *                   example: "Pedro Oliveira"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/admin-1.jpg"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T14:45:30.000Z"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Parent not found
 *       500:
 *         description: Internal server error
 */
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
