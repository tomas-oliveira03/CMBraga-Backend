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

export const UpdateChildSchema = z.object({
    name: z.string().min(1).optional(),
    gender: z.nativeEnum(ChildGender).optional(),
    school: z.string().optional(),
    schoolGrade: z.coerce.number().int().min(1).max(12).optional(),
    dateOfBirth: z.coerce.date().optional(),
    healthProblems: z.any().optional(),
    dropOffStationId: z.string().uuid().nullable().optional().or(z.literal("")),
    heightCentimeters: z.coerce.number().positive().optional(),
    weightKilograms: z.coerce.number().positive().optional(),
    parentId: z.string().uuid().optional().or(z.literal("")),
    removeParentId: z.string().uuid().optional().or(z.literal(""))
}).partial();


export type Child = z.infer<typeof ChildSchema>;
export type CreateChildInput = z.infer<typeof CreateChildSchema>;
export type UpdateChildInput = z.infer<typeof UpdateChildSchema>;



