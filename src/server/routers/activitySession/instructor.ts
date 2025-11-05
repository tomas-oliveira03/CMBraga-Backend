import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { UserNotificationType, UserRole } from "@/helpers/types";
import { authenticate, authorize } from "@/server/middleware/auth";
import { Instructor } from "@/db/entities/Instructor";
import { InstructorActivitySession } from "@/db/entities/InstructorActivitySession";
import { In } from "typeorm";
import { createNotificationForUser } from "@/server/services/notification";

const router = express.Router();

router.get('/all/:id', async (req: Request, res: Response) => {
    try {
        const activityId = req.params.id;

        const instructors = await AppDataSource.getRepository(Instructor).find();

        const instructorActivitySession = await AppDataSource.getRepository(InstructorActivitySession).find({
            where: {
                instructorId: In(instructors.map(instructor => instructor.id)),
                activitySessionId: activityId
            }
        });

        const instructorsWithFlags = instructors.map(instructor => {
                    const isAssigned = instructorActivitySession.some(
                        ias => ias.instructorId === instructor.id
                    );
                    return {
                        instructorId : instructor.id,
                        instructorName: instructor.name,
                        profilePictureURL: instructor.profilePictureURL,
                        isAssigned: isAssigned                    
                    };
                });

                return res.status(200).json(instructorsWithFlags);
        } catch(error){
            return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
        } 
});


router.get('/:id', async (req: Request, res: Response) => {
    try {
        const activityId = req.params.id;
        
        const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activityId
            },
            relations: {
                instructorActivitySessions: {
                    instructor: true
                }
            },
            select: {
                instructorActivitySessions: {
                    assignedAt: true,
                    instructor: true
                }
            }
        });

        if (!activityInfo){
            return res.status(404).json({ message: "Activity not found" })
        }

        return res.status(200).json(activityInfo?.instructorActivitySessions);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorIds } = req.body;

        if (!Array.isArray(instructorIds) || instructorIds.length === 0 || !instructorIds.every(id => typeof id === 'string')) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId },
            relations:{
                route: true
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if(activitySession.startedAt){
            return res.status(404).json({ message: "Cannot add instructors from an ongoing or past activity" });
        }

        const instructors = await AppDataSource.getRepository(Instructor).find({
            where: { id: In(instructorIds) }
        });
        if (instructors.length !== instructorIds.length) {
            return res.status(404).json({ message: "One or more instructors not found" });
        }

        // Check if any instructor is already assigned to this activity session        
        const existingAssignments = await AppDataSource.getRepository(InstructorActivitySession).find({
            where: {
                instructorId: In(instructorIds),
                activitySessionId: activitySessionId
            }
        });

        const alreadyAssignedIds = existingAssignments.map(a => a.instructorId);

        if (alreadyAssignedIds.length !== 0) {
            return res.status(400).json({ message: "One or more instructors are already assigned to this activity session" });
        }

        const newAssignments = instructors.map(instructor => ({
            instructorId: instructor.id,
            activitySessionId: activitySessionId!
        }));

        // Assign instructors to activity session
        await AppDataSource.getRepository(InstructorActivitySession).insert(newAssignments);

        instructors.forEach(instructor => {
            createNotificationForUser({
                type: UserNotificationType.INSTRUCTOR_ASSIGNED_TO_ACTIVITY,
                instructor: {
                    email: instructor.email,
                },
                activitySession: {
                    id: activitySession.id,
                    type: activitySession.type,
                    routeName: activitySession.route.name,
                    scheduledAt: activitySession.scheduledAt ,
                }
            })
        });

        return res.status(201).json({ message: "Instructors assigned to activity session successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.delete('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorId } = req.body;

        if (!instructorId) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if(activitySession.startedAt){
            return res.status(404).json({ message: "Cannot remove instructor from an ongoing or past activity" });
        }

        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        // Check if instructor is assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(InstructorActivitySession).findOne({
            where: {
                instructorId: instructorId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        // Remove instructor from activity session
        await AppDataSource.getRepository(InstructorActivitySession).delete({
            instructorId: instructorId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Instructor removed from activity session successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;