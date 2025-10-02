import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import express, { Request, Response } from "express";

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


export default router;
