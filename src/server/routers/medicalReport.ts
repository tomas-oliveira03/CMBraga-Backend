import { AppDataSource } from "@/db";
import { MedicalReport } from "@/db/entities/MedicalReport";
import express, { Request, Response } from "express";
import { CreateMedicalReportSchema, UpdateMedicalReportSchema } from "../schemas/medicalReport";
import { z } from "zod";
import { Child } from "@/db/entities/Child";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { createNotificationForUser } from "../services/notification";
import { UserNotificationType, UserRole } from "@/helpers/types";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

// Get all medical reports for a child
router.get('/child/:id', authenticate, authorize(UserRole.PARENT, UserRole.HEALTH_PROFESSIONAL, UserRole.ADMIN), async (req: Request, res : Response) => {
    try {
        const childId = req.params.id;

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }, 
            relations: {
                medicalReports: { 
                    healthProfessional: true,
                },
                parentChildren: true
            }
        })
        
        if(!child){
            return res.status(404).json({ message: "Child not found" });
        }
        if (req.user!.role === UserRole.PARENT && !child.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "You do not have permission to access this child's medical reports" });
        }

        const reports = child.medicalReports.map(report => ({
            id: report.id,
            child: {
                id: child.id,
                name: child.name
            },
            healthProfessional: {
                id: report.healthProfessional.id,
                name: report.healthProfessional.name,
                email: report.healthProfessional.email,
                specialty: report.healthProfessional.specialty
            },
            diagnosis: report.diagnosis,
            recommendations: report.recommendations,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
        }));

        return res.status(200).json(reports)
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/', authenticate, authorize(UserRole.HEALTH_PROFESSIONAL, UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const allReports = await AppDataSource.getRepository(MedicalReport).find();
        return res.status(200).json(allReports);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.PARENT, UserRole.HEALTH_PROFESSIONAL, UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const reportId = req.params.id;

        const report = await AppDataSource.getRepository(MedicalReport).findOne({
            where: {
                id: reportId
            },
            relations: {
                healthProfessional: true,
                child: {
                    parentChildren: true
                }
            }
        });

        if (!report){
            return res.status(404).json({ message: "Report not found" })
        }
        if (req.user!.role === UserRole.PARENT && report.child.parentChildren.some(pc => pc.parentId === req.user!.userId) === false) {
            return res.status(403).json({ message: "You do not have permission to access this report" });
        }

        return res.status(200).json({
            id: report.id,
            child: {
                id: report.child.id,
                name: report.child.name
            },
            healthProfessional: {
                id: report.healthProfessional.id,
                name: report.healthProfessional.name,
                email: report.healthProfessional.email,
                specialty: report.healthProfessional.specialty
            },
            diagnosis: report.diagnosis,
            recommendations: report.recommendations,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
        });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/', authenticate, authorize(UserRole.HEALTH_PROFESSIONAL), async (req: Request, res: Response) => {
    try {
        
        const validatedData = CreateMedicalReportSchema.parse(req.body);

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: validatedData.childId}
        })

        const healthProfessional = await AppDataSource.getRepository(HealthProfessional).findOne({
            where: {
                id: validatedData.healthProfessionalId
            }
        })

        if (!child){
            return res.status(404).json({ message: "Child not found" })
        }

        if (!healthProfessional){
            return res.status(404).json({ message: "Health professional not found" })
        }

        const medicalReport = await AppDataSource.getRepository(MedicalReport).insert(validatedData)
        
        createNotificationForUser({
            type: UserNotificationType.CHILD_MEDICAL_REPORT,
            child: {
                id: child.id,
                name: child.name
            },
            medicalReportId: medicalReport.identifiers[0]!.id
        })
        
        return res.status(201).json({message: "Medical report added successfully"});

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


router.put('/:id', authenticate, authorize(UserRole.HEALTH_PROFESSIONAL), async (req: Request, res: Response) => {
    try {
        const reportId = req.params.id;
        const validatedData = UpdateMedicalReportSchema.parse(req.body);
        
        const report = await AppDataSource.getRepository(MedicalReport).findOne({
            where: { id: reportId }
        })

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        if (report.healthProfessionalId !== req.user!.userId) {
            return res.status(403).json({ message: "You do not have permission to update this report" });
        }

        // Update report with updatedAt timestamp
        await AppDataSource.getRepository(MedicalReport).update(report.id, {
            ...validatedData,
            updatedAt: new Date()
        })
        
        return res.status(200).json({ message: "Report updated successfully" });

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


router.delete('/:id', authenticate, authorize(UserRole.HEALTH_PROFESSIONAL, UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const reportId = req.params.id;
        
        const report = await AppDataSource.getRepository(MedicalReport).findOne({
            where: { id: reportId }
        })

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        if (req.user!.role === UserRole.HEALTH_PROFESSIONAL && report.healthProfessionalId !== req.user!.userId) {
            return res.status(403).json({ message: "You do not have permission to delete this report" });
        }

        await AppDataSource.getRepository(MedicalReport).delete(report.id);

        return res.status(200).json({ message: "Report deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;
