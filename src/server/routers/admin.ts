import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import express, { Request, Response } from "express";
import { CreateAdminSchema, UpdateAdminSchema } from "../schemas/admin";
import { z } from "zod";
import informationHash from "@/lib/information-hash";

const router = express.Router();

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
    const allAdmins = await AppDataSource.getRepository(Admin).find();
    return res.status(200).json(allAdmins);
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
});

/**
 * @swagger
 * /admin:
 *   post:
 *     summary: Create a new admin
 *     description: Creates a new administrator
 *     tags:
 *       - Admin
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Carlos Pereira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "carlos.pereira@cmbraga.pt"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "MySecurePassword123!"
 *           example:
 *             name: "Ana Costa"
 *             email: "ana.costa@cmbraga.pt"
 *             password: "AdminPass2024!"
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin created successfully"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateAdminSchema.parse(req.body);
        validatedData.password = informationHash.encrypt(validatedData.password);

        await AppDataSource.getRepository(Admin).insert(validatedData)
        
        return res.status(201).json({message: "Admin created successfully"});

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
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456!"
 *           example:
 *             name: "Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const adminId = req.params.id;
        const validatedData = UpdateAdminSchema.parse(req.body);

        if (validatedData.password) {
            validatedData.password = informationHash.encrypt(validatedData.password);
        }
        
        const admin = await AppDataSource.getRepository(Admin).findOne({
            where: { id: adminId }
        })

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Update admin with updatedAt timestamp
        await AppDataSource.getRepository(Admin).update(admin.id, {
            ...validatedData,
            updatedAt: new Date()
        })
        
        return res.status(200).json({ message: "Admin updated successfully" });

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
 * /admin/{id}:
 *   delete:
 *     summary: Delete an admin
 *     description: Deletes an administrator by ID
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
 *         description: Admin deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin deleted successfully"
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
        const adminId = req.params.id;
        
        const admin = await AppDataSource.getRepository(Admin).findOne({
            where: { id: adminId }
        })

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        await AppDataSource.getRepository(Admin).delete(admin.id);
        
        return res.status(200).json({ message: "Admin deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
});



export default router;
