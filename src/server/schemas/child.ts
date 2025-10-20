import { z } from "zod";
import { ChildGender } from "@/helpers/types";

const zDate = z.preprocess((val) => {
  if (typeof val === "string" || typeof val === "number") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return val;
}, z.date());


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
  heightCentimeters: z.number().int(),
  weightKilograms: z.number().int(),
  school: z.string(),
  schoolGrade: z.number(),
  dropOffStationId: z.string(),
  dateOfBirth: zDate,
  healthProblems: HealthProblemsSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable()
});

export const CreateChildSchema = ChildSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateChildSchema = ChildSchema.omit({
    id: true,
    dateOfBirth: true,
    createdAt: true,
    updatedAt: true
}).partial();


export type Child = z.infer<typeof ChildSchema>;
export type CreateChildInput = z.infer<typeof CreateChildSchema>;
export type UpdateChildInput = z.infer<typeof UpdateChildSchema>;



