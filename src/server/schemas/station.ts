import { z } from "zod";
import { StationType } from "@/helpers/types";

export const StationTypeEnum = z.enum([StationType.REGULAR, StationType.SCHOOL]);

export const StationSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: StationTypeEnum,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable()
});

export const CreateStationSchema = StationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateStationSchema = StationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).partial();

export type Station = z.infer<typeof StationSchema>;
export type CreateStationInput = z.infer<typeof CreateStationSchema>;
export type UpdateStationInput = z.infer<typeof UpdateStationSchema>;
