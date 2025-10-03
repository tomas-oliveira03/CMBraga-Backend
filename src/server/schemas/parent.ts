import { z } from "zod";

export const ParentSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    phone: z.string(),
    address: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable()
});

export const CreateParentSchema = ParentSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateParentSchema = ParentSchema.omit({
    id: true,
    email: true,
    createdAt: true,
    updatedAt: true
}).partial();

export type Parent = z.infer<typeof ParentSchema>;
export type CreateParentInput = z.infer<typeof CreateParentSchema>;
export type UpdateParentInput = z.infer<typeof UpdateParentSchema>;
