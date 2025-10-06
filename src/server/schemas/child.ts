import { z } from "zod";
import { ChildGender } from "@/helpers/types";

const HealthProblemsSchema = z.object({
  allergies: z.string().array().optional(),
  chronicDiseases: z.string().array().optional(),
  surgeries: z
    .object({
      type: z.string(),
      year: z.number()
    })
    .array()
    .optional()
});

export const ChildSchema = z.object({
  id: z.string(),
  parentIds: z.array(z.string()),
  name: z.string(),
  gender: z.nativeEnum(ChildGender),
  school: z.string(),
  schoolGrade: z.number(),
  stationId: z.string(),
  dateOfBirth: z.coerce.date(),
  healthProblems: HealthProblemsSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable()
});

export const CreateChildSchema = ChildSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateChildSchema = CreateChildSchema.partial();


export type Child = z.infer<typeof ChildSchema>;
export type CreateChildInput = z.infer<typeof CreateChildSchema>;
export type UpdateChildInput = z.infer<typeof UpdateChildSchema>;
