import { AppDataSource } from "@/db";
import { MedicalReport } from "@/db/entities/MedicalReport";
import express, { Request, Response } from "express";
import { CreateMedicalReportSchema, UpdateMedicalReportSchema } from "../schemas/medicalReport";
import { z } from "zod";
import { Child } from "@/db/entities/Child";
import { HealthProfessional } from "@/db/entities/HealthProfessional";

const router = express.Router();

/**
 * @swagger
 * /medical-report/child/{id}:
 *   get:
 *     summary: Get medical reports for a child
 *     description: Returns the list of medical reports for a given child, including the diagnosis, recommendations and the health professional details.
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of medical reports for the child
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
 *                   diagnosis:
 *                     type: string
 *                     example: "Asma brônquica leve"
 *                   recommendations:
 *                     type: string
 *                     nullable: true
 *                     example: "Evitar ambientes com fumo e poeira"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   healthProfessional:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *                       name:
 *                         type: string
 *                         example: "Dr. João Pereira"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "joao.pereira@hospital.pt"
 *                       specialty:
 *                         type: string
 *                         example: "Pediatria"
 *       404:
 *         description: Child not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child not found"
 */
router.get('/child/:id', async (req: Request, res : Response) => {
    
    const childId = req.params.id;
    const child = await AppDataSource.getRepository(Child).findOne({
        where: { id: childId }, 
        relations: {
            medicalReports: { 
                healthProfessional: true
            }
        },
        select: {
            medicalReports:{
                id: true,
                diagnosis: true,
                recommendations: true,
                createdAt: true, 
                healthProfessional: {
                    id: true,
                    name: true,
                    email: true,
                    specialty: true
                }
            }
        }
    })
    
    if(!child){
        return res.status(404).json({ message: "Child not found" });
    }

    return res.status(200).json(child.medicalReports)
})

/**
 * @swagger
 * /medical-report:
 *   get:
 *     summary: Get all medical reports
 *     description: Returns a list of all medical reports
 *     tags:
 *       - Medical Report
 *     responses:
 *       200:
 *         description: List of medical reports
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
 *                   childId:
 *                     type: string
 *                     example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *                   healthProfessionalId:
 *                     type: string
 *                     example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *                   diagnosis:
 *                     type: string
 *                     example: "Asma brônquica leve"
 *                   recommendations:
 *                     type: string
 *                     nullable: true
 *                     example: "Evitar ambientes com fumo e poeira"
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
    const allReports = await AppDataSource.getRepository(MedicalReport).find();
    return res.status(200).json(allReports);
});

/**
 * @swagger
 * /medical-report/{id}:
 *   get:
 *     summary: Get medical report by ID
 *     description: Returns a single medical report by its ID
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Medical Report ID (UUID)
 *     responses:
 *       200:
 *         description: Medical report found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 childId:
 *                   type: string
 *                   example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *                 healthProfessionalId:
 *                   type: string
 *                   example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *                 diagnosis:
 *                   type: string
 *                   example: "Rinite alérgica"
 *                 recommendations:
 *                   type: string
 *                   nullable: true
 *                   example: "Medicação antihistamínica conforme necessário"
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
 *         description: Medical report not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
    const reportId = req.params.id;

    const report = await AppDataSource.getRepository(MedicalReport).findOne({
        where: {
            id: reportId
        }
    });

    if (!report){
        return res.status(404).json({ message: "Report not found" })
    }

    return res.status(200).json(report);
});

/**
 * @swagger
 * /medical-report:
 *   post:
 *     summary: Create a new medical report
 *     description: Creates a new medical report for a child
 *     tags:
 *       - Medical Report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - healthProfessionalId
 *               - diagnosis
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *               healthProfessionalId:
 *                 type: string
 *                 example: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *               diagnosis:
 *                 type: string
 *                 example: "Alergia alimentar a frutos secos"
 *               recommendations:
 *                 type: string
 *                 nullable: true
 *                 example: "Evitar completamente frutos secos e derivados"
 *           example:
 *             childId: "c1d2e3f4-g5h6-7890-ijkl-mn1234567890"
 *             healthProfessionalId: "h1i2j3k4-l5m6-7890-nopq-rs1234567890"
 *             diagnosis: "Dermatite atópica moderada"
 *             recommendations: "Hidratar a pele duas vezes ao dia"
 *     responses:
 *       201:
 *         description: Medical report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medical report added successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Child or health professional not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req: Request, res: Response) => {
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

        await AppDataSource.getRepository(MedicalReport).insert(validatedData)
        
        return res.status(201).json({message: "Medical report added successfully"});

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
 * /medical-report/{id}:
 *   put:
 *     summary: Update a medical report
 *     description: Updates an existing medical report
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Medical Report ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: string
 *                 example: "Asma brônquica moderada (atualização)"
 *               recommendations:
 *                 type: string
 *                 nullable: true
 *                 example: "Medicação inalatória diária e evitar exercício intenso"
 *           example:
 *             diagnosis: "Rinite alérgica sazonal"
 *             recommendations: "Tratamento com corticosteroides nasais durante primavera"
 *     responses:
 *       200:
 *         description: Medical report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Medical report not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const reportId = req.params.id;
        const validatedData = UpdateMedicalReportSchema.parse(req.body);
        
        const report = await AppDataSource.getRepository(MedicalReport).findOne({
            where: { id: reportId }
        })

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
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
        
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /medical-report/{id}:
 *   delete:
 *     summary: Delete a medical report
 *     description: Deletes a medical report by ID
 *     tags:
 *       - Medical Report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Medical Report ID (UUID)
 *     responses:
 *       200:
 *         description: Medical report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report deleted successfully"
 *       404:
 *         description: Medical report not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report not found"
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
        const reportId = req.params.id;
        
        const report = await AppDataSource.getRepository(MedicalReport).findOne({
            where: { id: reportId }
        })

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        await AppDataSource.getRepository(MedicalReport).delete(report.id);

        return res.status(200).json({ message: "Report deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
});



export default router;
