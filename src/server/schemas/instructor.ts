import { z } from "zod";

export const InstructorSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    createdAt: z.date(),
    activatedAt: z.date().nullable(),
    updatedAt: z.date().nullable()
});

export const CreateInstructorSchema = InstructorSchema.omit({
    id: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true,
    password: true
});

export const UpdateInstructorSchema = InstructorSchema.omit({
    id: true,
    email: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true
}).partial();

export type Instructor = z.infer<typeof InstructorSchema>;
export type CreateInstructorInput = z.infer<typeof CreateInstructorSchema>;
export type UpdateInstructorInput = z.infer<typeof UpdateInstructorSchema>;