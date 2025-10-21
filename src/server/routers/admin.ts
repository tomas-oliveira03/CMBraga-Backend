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

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Get all admins
 *     description: Returns a list of all administrators
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: List of administrators
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
 *                   name:
 *                     type: string
 *                     example: "João Silva"
 *                   email:
 *                     type: string
 *                     example: "joao.silva@cmbraga.pt"
 *                   phone:
 *                     type: string
 *                     example: "912345678"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/admin-1.jpg"
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
        const allAdmins = await AppDataSource.getRepository(Admin).find();
        return res.status(200).json(allAdmins);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /admin/{id}:
 *   get:
 *     summary: Get admin by ID
 *     description: Returns a single administrator by their ID
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Admin ID (UUID)
 *     responses:
 *       200:
 *         description: Administrator found
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
 *                   example: "Maria Santos"
 *                 email:
 *                   type: string
 *                   example: "maria.santos@cmbraga.pt"
 *                 phone:
 *                   type: string
 *                   example: "963852741"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/admin-2.jpg"
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
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /admin/{id}:
 *   put:
 *     summary: Update an admin
 *     description: Updates an existing administrator
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Admin ID (UUID)
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
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               phone:
 *                 type: string
 *                 example: "987654321"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
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
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               phone:
 *                 type: string
 *                 example: "987654321"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *           example:
 *             name: "Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *             phone: "951753468"
 *     responses:
 *       200:
 *         description: Admin updated successfully
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
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const adminId = req.params.id;
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

        if (validatedData.password) {
            adminData.password = informationHash.encrypt(validatedData.password);
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
