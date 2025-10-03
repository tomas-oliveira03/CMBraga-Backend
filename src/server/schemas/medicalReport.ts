import { z } from "zod";

export const MedicalReportSchema = z.object({
    id: z.string(),
    childId: z.string(),
    healthProfessionalId: z.string(),
    diagnosis: z.string(),
    recommendations: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable()
});

export const CreateMedicalReportSchema = MedicalReportSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateMedicalReportSchema = MedicalReportSchema.omit({
    id: true,
    childId: true,
    healthProfessionalId: true,
    createdAt: true,
    updatedAt: true
}).partial();

export type MedicalReport = z.infer<typeof MedicalReportSchema>;
export type CreateMedicalReportInput = z.infer<typeof CreateMedicalReportSchema>;
export type UpdateMedicalReportInput = z.infer<typeof UpdateMedicalReportSchema>;
