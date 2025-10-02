import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import express, { Request, Response } from "express";
import { CreateAdminSchema } from "../schemas/admin";
import { z } from "zod";

const router = express.Router();


router.get('/', async (req: Request, res: Response) => {
    const allAdmins = await AppDataSource.getRepository(Admin).find();
    return res.status(200).json(allAdmins);
});


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


router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = CreateAdminSchema.parse(req.body);
        
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


export default router;
