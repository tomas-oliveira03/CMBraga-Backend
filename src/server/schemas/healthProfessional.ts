import { z } from "zod";
import { Specialty } from "@/db/entities/HealthProfessional";

export const HealthProfessionalSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    specialty: z.nativeEnum(Specialty),
    createdAt: z.date(),
    updatedAt: z.date().nullable()
});

export const CreateHealthProfessionalSchema = HealthProfessionalSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateHealthProfessionalSchema = HealthProfessionalSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).partial();

export type HealthProfessional = z.infer<typeof HealthProfessionalSchema>;
export type CreateHealthProfessionalInput = z.infer<typeof CreateHealthProfessionalSchema>;
export type UpdateHealthProfessionalInput = z.infer<typeof UpdateHealthProfessionalSchema>;
