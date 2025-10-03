import { z } from "zod";

export const AdminSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable()
});

export const CreateAdminSchema = AdminSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateAdminSchema = AdminSchema.omit({
    id: true,
    email: true,
    createdAt: true,
    updatedAt: true
}).partial();

export type Admin = z.infer<typeof AdminSchema>;
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminInput = z.infer<typeof UpdateAdminSchema>;
