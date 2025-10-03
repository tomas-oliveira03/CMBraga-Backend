import { z } from "zod";

export const InstructorSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    phone: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable()
});

export const CreateInstructorSchema = InstructorSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateInstructorSchema = InstructorSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).partial();

export type Instructor = z.infer<typeof InstructorSchema>;
export type CreateInstructorInput = z.infer<typeof CreateInstructorSchema>;
export type UpdateInstructorInput = z.infer<typeof UpdateInstructorSchema>;