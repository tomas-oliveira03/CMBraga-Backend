import express, { Request, Response } from "express";
import { z } from "zod";
import { AuthenticationService } from "../services/auth";
import { authenticate, authorize } from "../middleware/auth";
import { LoginSchema } from "../schemas/auth";
import { envs } from "@/config";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import informationHash from "@/lib/information-hash";
import { checkIfEmailExists } from "../services/validator";
import { CreateAdminSchema } from "../schemas/admin";
import { Admin } from "@/db/entities/Admin";
import { CreateInstructorSchema } from "../schemas/instructor";
import { Instructor } from "@/db/entities/Instructor";
import { CreateHealthProfessionalSchema } from "../schemas/healthProfessional";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { CreateParentSchema } from "../schemas/parent";
import { Parent } from "@/db/entities/Parent";
import { createPasswordEmail, resetPassword, verifyToken } from "../services/email";
import { Child } from "@/db/entities/Child";
import { ParentChild } from "@/db/entities/ParentChild";
import { Station } from "@/db/entities/Station";
import { selectRandomDefaultProfilePicture } from "@/helpers/storage";
import { StationType, UserRole } from "@/helpers/types";
import { In } from "typeorm";
import { CreateChildSchema } from "../schemas/child";
import { webSocketManager } from "../services/websocket";
import { ChildHistory } from "@/db/entities/ChildHistory";
import { differenceInYears } from "date-fns";
import redisClient from "@/lib/redis";
import { addUserToGeneralChat } from "../services/comms";
import passwordHash from "@/lib/password-hash";

const router = express.Router();


router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = LoginSchema.parse(req.body);

        const result = await AuthenticationService.login(validatedData);

        const wsUrl = `${envs.WEBSOCKET_BASE_URL}/ws?token=${result.token}`;
        
        return res.status(200).json({
            ...result,
            websocketURL: wsUrl 
        });
        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }
        
        return res.status(401).json({ message: "Invalid email or password" });
    }
});


router.post('/logout', authenticate, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token || !req.user) {
            return res.status(401).json({ message: 'Access token required' });
        }

        // Blacklist token in Redis until its expiration (1 day fallback)
        const exp = req.user.expirationTime;
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp && exp > now ? exp - now : 60 * 60 * 24;

        await redisClient.set(`blacklist:${token}`, "1", ttl);

        if (req.user.email) {
            webSocketManager.disconnectUser(req.user.email);
        }

        return res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/profile', authenticate, (req: Request, res: Response) => {
    try {
        return res.status(200).json({
            message: "Profile retrieved successfully",
            user: req.user
        });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/register/admin', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateAdminSchema.parse(req.body);
        
        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }

        const profilePictureURL = selectRandomDefaultProfilePicture()
        
        await AppDataSource.transaction(async tx => {
            
            const admin = await tx.getRepository(Admin).insert({
                ...validatedData,
                profilePictureURL: profilePictureURL,
            });
            const adminId = admin.identifiers[0]?.id

            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                profilePictureURL: profilePictureURL,
                adminId: adminId
            });
        })
        
        await createPasswordEmail(validatedData.email, validatedData.name);

        await addUserToGeneralChat(validatedData.email);

        return res.status(201).json({message: "Admin created successfully"});

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


router.post('/register/instructor', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateInstructorSchema.parse(req.body);

        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }

        const dateNow = new Date()
        const profilePictureURL = selectRandomDefaultProfilePicture()
        const hashedPassword = await passwordHash.hash("Person23!");

        await AppDataSource.transaction(async tx => {

            const instructor = await tx.getRepository(Instructor).insert({
                ...validatedData,
                updatedAt: dateNow,
                activatedAt: dateNow,
                profilePictureURL: profilePictureURL,
                password: hashedPassword,
            });
            const instructorId = instructor.identifiers[0]?.id

            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                profilePictureURL: profilePictureURL,
                instructorId: instructorId,
            });
        })
        // await createPassword(validatedData.email, validatedData.name);
        await addUserToGeneralChat(validatedData.email);
        
        return res.status(201).json({message: "Instructor created successfully"});

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


router.post('/register/health-professional', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateHealthProfessionalSchema.parse(req.body);
        
        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }

        const dateNow = new Date()
        const profilePictureURL = selectRandomDefaultProfilePicture()
        const hashedPassword = await passwordHash.hash("Person23!");

        await AppDataSource.transaction(async tx => {
            
            const healthProfessional = await tx.getRepository(HealthProfessional).insert({
                ...validatedData,
                updatedAt: dateNow,
                activatedAt: dateNow,
                profilePictureURL: profilePictureURL,
                password: hashedPassword,
            });
            const healthProfessionalId = healthProfessional.identifiers[0]?.id
            
            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                profilePictureURL: profilePictureURL,
                healthProfessionalId: healthProfessionalId
            });
        })

        // await createPassword(validatedData.email, validatedData.name);
        await addUserToGeneralChat(validatedData.email);

        return res.status(201).json({message: "Health Professional created successfully"});
        
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


router.post('/register/parent', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateParentSchema.parse(req.body);

        const emailExists = await checkIfEmailExists(validatedData.email)
        if (emailExists){
            return res.status(409).json({message: "Email already exists"});
        }

        const dateNow = new Date()
        const profilePictureURL = selectRandomDefaultProfilePicture()
        const hashedPassword = await passwordHash.hash("Person23!");
        
        await AppDataSource.transaction(async tx => {
            
            const parent = await tx.getRepository(Parent).insert({
                ...validatedData,
                updatedAt: dateNow,
                activatedAt: dateNow,
                profilePictureURL: profilePictureURL,
                password: hashedPassword,
            });
            const parentId = parent.identifiers[0]?.id
            
            await tx.getRepository(User).insert({
                id: validatedData.email,
                name: validatedData.name,
                profilePictureURL: profilePictureURL,
                parentId: parentId
            });
        })
        
        // await createPassword(validatedData.email, validatedData.name);

        await addUserToGeneralChat(validatedData.email);
        return res.status(201).json({message: "Parent created successfully"});

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


router.post('/register/child', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validatedData = CreateChildSchema.parse(req.body);
            
        const parents = await AppDataSource.getRepository(Parent).find({
            where: {
                id: In (validatedData.parentIds)
            }
        })
        
        if(parents.length !== validatedData.parentIds.length){
            return res.status(404).json({message: "At least one parent doesn't exist"});
        }

        const station = await AppDataSource.getRepository(Station).findOne({
            where: {
                id: validatedData.dropOffStationId,
                type: StationType.SCHOOL
            }
        })
        if(!station){
            return res.status(404).json({message: "Station does not exist or it isn't labeled as school"});
        }

        const profilePictureURL = selectRandomDefaultProfilePicture()
        const childData = {
            ...validatedData,
            profilePictureURL: profilePictureURL
        }

        await AppDataSource.transaction(async tx => {
            const child = await tx.getRepository(Child).insert(childData);
        
            const childId = child.identifiers[0]!.id;

            const parentChildConnector = parents.map(parent => ({
                parentId: parent.id,
                childId: childId
            }));

            await tx.getRepository(ParentChild).insert(parentChildConnector);
        });

        return res.status(201).json({message: "Child created successfully"});

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
