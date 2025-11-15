import { z } from "zod";

export const AdminSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    createdAt: z.date(),
    activatedAt: z.date().nullable(),
    updatedAt: z.date().nullable()
});

export const CreateAdminSchema = AdminSchema.omit({
    id: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true,
    password: true
});

export const UpdateAdminSchema = AdminSchema.omit({
    id: true,
    email: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true
}).partial();

export type Admin = z.infer<typeof AdminSchema>;
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminInput = z.infer<typeof UpdateAdminSchema>;
