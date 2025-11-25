import { AppDataSource } from "@/db";
import { Parent } from "@/db/entities/Parent";
import express, { Request, Response } from "express";
import { UpdateParentSchema } from "../schemas/parent";
import { z } from "zod";
import informationHash from "@/lib/information-hash";
import multer from "multer";
import { updateProfilePicture } from "../services/user";
import { isValidImageFile, MAX_PICTURE_SIZE } from "@/helpers/storage";
import { User } from "@/db/entities/User";
import { ChildStationType, UserRole } from "@/helpers/types";
import { authenticate, authorize } from "../middleware/auth";
import { Child } from "@/db/entities/Child";
import { ParentStat } from "@/db/entities/ParentStat";
import { ChildStat } from "@/db/entities/ChildStat";
import { ParentChild } from "@/db/entities/ParentChild";
import { ParentStation } from "@/db/entities/ParentStation";
import { ChildStation } from "@/db/entities/ChildStation";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const allParents = await AppDataSource.getRepository(Parent).find();
        return res.status(200).json(allParents);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Get all children from a parent perspective
router.get('/child', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const allChildren = await AppDataSource.getRepository(Child).find({
            where: {
                parentChildren: {
                    parentId: req.user!.userId
                }
            },
            relations: {
                dropOffStation: true,
                parentChildren: true
            }
        });

        const childrenPayload = allChildren.map(child => ({
            id: child.id,
            name: child.name,
            profilePictureURL: child.profilePictureURL,
            gender: child.gender,
            heightCentimeters: child.heightCentimeters,
            weightKilograms: child.weightKilograms,
            school: child.school,
            schoolGrade: child.schoolGrade,
            dropOffStation: {
                id: child.dropOffStationId,
                name: child.dropOffStation.name
            },
            dateOfBirth: child.dateOfBirth,
            healthProblems: child.healthProblems,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt
        }));


        return res.status(200).json(childrenPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


// Get activity count stats for parent and their children
router.get('/activity-stats', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const parentId = req.user!.userId;

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { id: parentId },
            relations: {
                parentChildren: {
                    child: true
                }
            }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }

        const parentActivitiesCount = await AppDataSource.getRepository(ParentStation).count({
            where: {
                parentId: parentId
            }
        })

        const childStats = [];

        for (const parentChild of parent.parentChildren) {
            const child = parentChild.child;

            const count = await AppDataSource.getRepository(ChildStation).count({
                where: {
                    childId: child.id,
                    type: ChildStationType.OUT
                }
            });

            childStats.push({
                childId: child.id,
                childName: child.name,
                activityCount: count
            });
        }

        return res.status(200).json({
            parentActivitiesCount: parentActivitiesCount,
            childStats: childStats
        });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put('/:id', authenticate, authorize(UserRole.PARENT), upload.single('file'), async (req: Request, res: Response) => {
    try {
        const parentId = req.user!.userId
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

        if (req.file){
            if (!isValidImageFile(req.file)){
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            if (req.file.size > MAX_PICTURE_SIZE) {
                return res.status(400).json({ message: "File size exceeds 10MB limit" });
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

router.get('/parent-stats', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const parentId = req.user!.userId;
        
        const allParentStats = await AppDataSource.getRepository(ParentStat).find({
            where: {
                parentId: parentId
            }
        });

        if (allParentStats.length === 0) {
            return res.status(200).json([]);
        }

        const childStatsFromParentStats = await AppDataSource.getRepository(ChildStat).findByIds(
            allParentStats.map(stat => stat.childStatId)
        );

        const last10ChildStats = allParentStats
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10)

        const totalDistanceMeters = childStatsFromParentStats.reduce((sum, stat) => sum + stat.distanceMeters, 0);
        const totalCo2Saved = childStatsFromParentStats.reduce((sum, stat) => sum + stat.co2Saved, 0);
        const totalPointsEarned = childStatsFromParentStats.reduce((sum, stat) => sum + stat.pointsEarned, 0);


        return res.status(200).json({
            totalDistanceMeters,
            totalCo2Saved,
            totalPointsEarned,
            stats: last10ChildStats.map(parentStat => {
                const childStat = childStatsFromParentStats.find(stat => stat.id === parentStat.childStatId)!;
                return {
                    id: childStat.id,
                    distanceMeters: childStat.distanceMeters,
                    co2Saved: childStat.co2Saved,
                    caloriesBurned: childStat.caloriesBurned,
                    pointsEarned: childStat.pointsEarned,
                    activityDate: childStat.activityDate,
                    activitySessionId: childStat.activitySessionId
                };
            })
        });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})


router.get('/child-stats/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;

        const isFatherOfChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: req.user!.userId,
                childId: childId
            }
        });

        if (!isFatherOfChild) {
            return res.status(403).json({ message: "You do not have access to this child's stats" });
        }

        const allChildStats = await AppDataSource.getRepository(ChildStat).find({
            where: {
                childId: childId
            }
        });

        const last10Stats = allChildStats
            .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime())
            .slice(0, 10);

        const totalDistanceMeters = allChildStats.reduce((sum, stat) => sum + stat.distanceMeters, 0);
        const totalCo2Saved = allChildStats.reduce((sum, stat) => sum + stat.co2Saved, 0);
        const totalPointsEarned = allChildStats.reduce((sum, stat) => sum + stat.pointsEarned, 0);

        return res.status(200).json({
            totalDistanceMeters,
            totalCo2Saved,
            totalPointsEarned,
            stats: last10Stats.map(stat => ({
                id: stat.id,
                distanceMeters: stat.distanceMeters,
                co2Saved: stat.co2Saved,
                caloriesBurned: stat.caloriesBurned,
                pointsEarned: stat.pointsEarned,
                activityDate: stat.activityDate,
                activitySessionId: stat.activitySessionId
            }))
        });
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

router.get('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.PARENT), async (req: Request, res: Response) => {
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

export default router;
