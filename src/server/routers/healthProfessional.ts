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

/**
 * @swagger
 * /health-professional:
 *   get:
 *     summary: Get all health professionals
 *     description: Returns a list of all health professionals
 *     tags:
 *       - Health Professional
 *     responses:
 *       200:
 *         description: List of health professionals
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
 *                     example: "Dr. João Silva"
 *                   email:
 *                     type: string
 *                     example: "joao.silva@cmbraga.pt"
 *                   phone:
 *                     type: string
 *                     example: "912345678"
 *                   specialty:
 *                     type: string
 *                     enum: [pediatrician, nutritionist, general_practitioner]
 *                     example: "pediatrician"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/doctor-1.jpg"
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
        const allHealthProfessionals = await AppDataSource.getRepository(HealthProfessional).find();
        return res.status(200).json(allHealthProfessionals);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /health-professional/{id}:
 *   get:
 *     summary: Get health professional by ID
 *     description: Returns a single health professional by their ID
 *     tags:
 *       - Health Professional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Health Professional ID (UUID)
 *     responses:
 *       200:
 *         description: Health professional found
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
 *                   example: "Dr. Maria Santos"
 *                 email:
 *                   type: string
 *                   example: "maria.santos@cmbraga.pt"
 *                 phone:
 *                   type: string
 *                   example: "963852741"
 *                 specialty:
 *                   type: string
 *                   enum: [pediatrician, nutritionist, general_practitioner]
 *                   example: "nutritionist"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/doctor-2.jpg"
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
 *         description: Health professional not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health professional not found"
 */
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


/**
 * @swagger
 * /health-professional/{id}:
 *   put:
 *     summary: Update a health professional
 *     description: Updates an existing health professional
 *     tags:
 *       - Health Professional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Health Professional ID (UUID)
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
 *                 example: "Dr. Pedro Oliveira"
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
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "nutritionist"
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
 *                 example: "Dr. Pedro Oliveira"
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
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "nutritionist"
 *           example:
 *             name: "Dr. Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *             phone: "951753468"
 *             specialty: "pediatrician"
 *     responses:
 *       200:
 *         description: Health professional updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health Professional updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Health professional not found
 *       500:
 *         description: Internal server error
 */
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
        
        await AppDataSource.transaction(async tx => {

            await tx.getRepository(HealthProfessional).update(healthProfessional.id, {
                ...healthProfessionalData,
                updatedAt: new Date()
            })

            // If name or profilePictureURL are updated, the copy in User table also needs to be updated
            if (Object.keys(userUpdateData).length > 0) {
                await tx.getRepository(User).update(
                    { id: healthProfessional.email },
                    userUpdateData
                );
            }
        });
        
        return res.status(200).json({ message: "Health Professional updated successfully" });

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