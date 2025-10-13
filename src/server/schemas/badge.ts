
import { BadgeCriteria } from "@/helpers/types";
import { z } from "zod";

export const CreateBadgeSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    criteria: z.nativeEnum(BadgeCriteria),
    value: z.number().min(0)
});

export const UpdateBadgeSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    criteria: z.nativeEnum(BadgeCriteria).optional(),
    value: z.number().min(0).optional()
});
