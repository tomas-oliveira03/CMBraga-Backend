import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole, ActivitySessionStatus } from "@/helpers/types";
import { User } from "@/db/entities/User";
import { MoreThan, IsNull, Not } from "typeorm";

const USER_LIMIT = 50;
const ACTIVITY_LIMIT = 50;

const router = express.Router();


// Get issues informationn in given activity
router.get('/issue/activity/:id', async (req: Request, res : Response) => {
    try {
        const activityId = req.params.id;
        const activity = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activityId }, 
            relations: {
                issues: true
            },
            select: {
                id: true,
                type: true,
                scheduledAt: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
                updatedAt: true,
                issues:{
                    id: true,
                    description: true,
                    imageURLs: true,
                    createdAt: true,
                    updatedAt: true,
                    resolvedAt: true,
                    instructorId: true
                }
            }
        })
        
        if(!activity){
            return res.status(404).json({ message: "Activity not found" });
        }

        return res.status(200).json(activity)
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})

// Get all the users info, paginated
router.get('/users', authenticate, authorize(UserRole.ADMIN), async (req: Request, res : Response) => {
    try {

        if (req.query.page && isNaN(Number(req.query.page))) {
            return res.status(400).json({ message: "Invalid page query parameter" });
        }

        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * USER_LIMIT;
        
        const userRepo = AppDataSource.getRepository(User);

        // new: role filtering
        const roleParam = req.query.role as string | undefined;
        let roleFilterColumn: string | null = null;
        if (roleParam !== undefined) {
            if (!Object.values(UserRole).includes(roleParam as UserRole)) {
                return res.status(400).json({ message: "Invalid role parameter" });
            }
            switch (roleParam) {
                case UserRole.ADMIN:
                    roleFilterColumn = "adminId";
                    break;
                case UserRole.INSTRUCTOR:
                    roleFilterColumn = "instructorId";
                    break;
                case UserRole.PARENT:
                    roleFilterColumn = "parentId";
                    break;
                case UserRole.HEALTH_PROFESSIONAL:
                    roleFilterColumn = "healthProfessionalId";
                    break;
                default:
                    roleFilterColumn = null;
                    break;
            }
        }

        let userList: User[] = [];
        let totalCount = 0;
        if (roleFilterColumn) {
            const qb = userRepo.createQueryBuilder("user")
                .where(`user.${roleFilterColumn} IS NOT NULL`)
                .orderBy("user.name", "ASC")
                .skip(skip)
                .take(USER_LIMIT);
            [userList, totalCount] = await qb.getManyAndCount();
        } else {
            const result = await userRepo.findAndCount({
                skip,
                take: USER_LIMIT
            });
            userList = result[0];
            totalCount = result[1];
        }
        
        if (page === 1) {
            const [adminCount, instructorCount, parentCount, hpCount] = await Promise.all([
                userRepo.createQueryBuilder("user").where("user.adminId IS NOT NULL").getCount(),
                userRepo.createQueryBuilder("user").where("user.instructorId IS NOT NULL").getCount(),
                userRepo.createQueryBuilder("user").where("user.parentId IS NOT NULL").getCount(),
                userRepo.createQueryBuilder("user").where("user.healthProfessionalId IS NOT NULL").getCount()
            ]);
            
            return res.status(200).json({
                users: userList,
                total: totalCount,
                countsByRole: {
                    admin: adminCount,
                    instructor: instructorCount,
                    parent: parentCount,
                    health_professional: hpCount
                },
                page
            });
        }

        return res.status(200).json({
            users: userList,
            page
        });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})

// Get all activity sessions, paginated
router.get('/activity-sessions', authenticate, authorize(UserRole.ADMIN), async (req: Request, res : Response) => {
    try {
        if (req.query.page && isNaN(Number(req.query.page))) {
            return res.status(400).json({ message: "Invalid page query parameter" });
        }

        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * ACTIVITY_LIMIT;

        const activityRepo = AppDataSource.getRepository(ActivitySession);

        const status = (req.query.status as string | undefined)?.toLowerCase();
        let where: any = {};
        let order: any = {};

        switch (status) {
            case ActivitySessionStatus.FUTURE:
                where = {
                    startedAt: IsNull(),
                    scheduledAt: MoreThan(new Date())
                };
                order = { scheduledAt: "ASC" };
                break;
            case ActivitySessionStatus.ONGOING:
                where = {
                    startedAt: Not(IsNull()),
                    finishedAt: IsNull()
                };
                order = { startedAt: "DESC" };
                break;
            case ActivitySessionStatus.ENDED:
                where = {
                    finishedAt: Not(IsNull())
                };
                order = { finishedAt: "DESC" };
                break;
            default:
                order = { scheduledAt: "ASC" };
                break;
        }

        const [sessions, total] = await activityRepo.findAndCount({
            where,
            order,
            skip,
            take: ACTIVITY_LIMIT
        });

        if (page === 1) {
            const now = new Date();

            const [futureCount, ongoingCount, finishedCount] = await Promise.all([
                activityRepo.count({
                    where: {
                        startedAt: IsNull(),
                        scheduledAt: MoreThan(now)
                    }
                }),
                activityRepo.count({
                    where: {
                        startedAt: Not(IsNull()),
                        finishedAt: IsNull()
                    }
                }),
                activityRepo.count({
                    where: {
                        finishedAt: Not(IsNull())
                    }
                })
            ]);

            return res.status(200).json({
                activitySessions: sessions,
                total,
                countsByStatus: {
                    future: futureCount,
                    ongoing: ongoingCount,
                    finished: finishedCount
                },
                page
            });
        }

        return res.status(200).json({
            activitySessions: sessions,
            total,
            page
        });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
