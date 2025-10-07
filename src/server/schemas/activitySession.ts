import { z } from "zod";
import { ActivityType } from "@/helpers/types";

export const ActivityTypeEnum = z.enum([ActivityType.PEDIBUS, ActivityType.CICLO_EXPRESSO]);

export const ActivitySessionSchema = z.object({
    id: z.string(),
    type: ActivityTypeEnum,
    scheduledAt: z.coerce.date(),
    startedAt: z.coerce.date(),
    finishedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable(),
    startedById: z.string().nullable(),
    finishedById: z.string().nullable()
});

export const CreateActivitySessionSchema = ActivitySessionSchema.omit({
    id: true,
    startedAt: true,
    finishedAt: true,
    createdAt: true,
    updatedAt: true,
    startedById: true,
    finishedById: true
});

export const UpdateActivitySessionSchema = ActivitySessionSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    startedById: true,
    finishedById: true
}).partial();

export type ActivitySession = z.infer<typeof ActivitySessionSchema>;
export type CreateActivitySessionInput = z.infer<typeof CreateActivitySessionSchema>;
export type UpdateActivitySessionInput = z.infer<typeof UpdateActivitySessionSchema>;
