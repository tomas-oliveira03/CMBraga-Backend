import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { z } from "zod";
import { CreateHealthProfessionalSchema, UpdateHealthProfessionalSchema } from "../schemas/healthProfessional";
import informationHash from "@/lib/information-hash";

const router = express.Router();

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
 *                   specialty:
 *                     type: string
 *                     enum: [pediatrician, nutritionist, general_practitioner]
 *                     example: "pediatrician"
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
    const allHealthProfessionals = await AppDataSource.getRepository(HealthProfessional).find();
    return res.status(200).json(allHealthProfessionals);
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
 *                 specialty:
 *                   type: string
 *                   enum: [pediatrician, nutritionist, general_practitioner]
 *                   example: "nutritionist"
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
});

/**
 * @swagger
 * /health-professional:
 *   post:
 *     summary: Create a new health professional
 *     description: Creates a new health professional
 *     tags:
 *       - Health Professional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - specialty
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Dr. Carlos Pereira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "carlos.pereira@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "MySecurePassword123!"
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "general_practitioner"
 *           example:
 *             name: "Dr. Ana Costa"
 *             email: "ana.costa@cmbraga.pt"
 *             password: "DoctorPass2024!"
 *             specialty: "pediatrician"
 *     responses:
 *       201:
 *         description: Health professional created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health Professional created successfully"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateHealthProfessionalSchema.parse(req.body);
        validatedData.password = informationHash.encrypt(validatedData.password);

        await AppDataSource.getRepository(HealthProfessional).insert(validatedData)
        
        return res.status(201).json({message: "Health Professional created successfully"});

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error });
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
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const healthProfessionalId = req.params.id;
        const validatedData = UpdateHealthProfessionalSchema.parse(req.body);

        if (validatedData.password) {
            validatedData.password = informationHash.encrypt(validatedData.password);
        }
        
        const healthProfessional = await AppDataSource.getRepository(HealthProfessional).findOne({
            where: { id: healthProfessionalId }
        })

        if (!healthProfessional) {
            return res.status(404).json({ message: "Health Professional not found" });
        }

        // Update health professional with updatedAt timestamp
        await AppDataSource.getRepository(HealthProfessional).update(healthProfessional.id, {
            ...validatedData,
            updatedAt: new Date()
        })
        
        return res.status(200).json({ message: "Health Professional updated successfully" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /health-professional/{id}:
 *   delete:
 *     summary: Delete a health professional
 *     description: Deletes a health professional by ID
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
 *         description: Health professional deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health Professional deleted successfully"
 *       404:
 *         description: Health professional not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health Professional not found"
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
        const healthProfessionalId = req.params.id;
        
        const healthProfessional = await AppDataSource.getRepository(HealthProfessional).findOne({
            where: { id: healthProfessionalId }
        })

        if (!healthProfessional) {
            return res.status(404).json({ message: "Health Professional not found" });
        }

        await AppDataSource.getRepository(HealthProfessional).delete(healthProfessional.id);
        
        return res.status(200).json({ message: "Health Professional deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
});

export default router;