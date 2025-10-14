import { HealthProfessionalSpecialty } from "@/helpers/types";
import { z } from "zod";

export const HealthProfessionalSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    specialty: z.nativeEnum(HealthProfessionalSpecialty),
    createdAt: z.date(),
    activatedAt: z.date().nullable(),
    updatedAt: z.date().nullable()
});

export const CreateHealthProfessionalSchema = HealthProfessionalSchema.omit({
    id: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true,
    password: true
});

export const UpdateHealthProfessionalSchema = HealthProfessionalSchema.omit({
    id: true,
    email: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true
}).partial();

export type HealthProfessional = z.infer<typeof HealthProfessionalSchema>;
export type CreateHealthProfessionalInput = z.infer<typeof CreateHealthProfessionalSchema>;
export type UpdateHealthProfessionalInput = z.infer<typeof UpdateHealthProfessionalSchema>;
