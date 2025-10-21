import { z } from "zod";
import { ActivityTypeEnum } from "./activitySession";

export const RoutePointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const RouteSchema = z.object({
    id: z.string(),
    name: z.string(),
    activityType: ActivityTypeEnum,
    distanceMeters: z.number(),
    boundsNorth: z.number(),
    boundsSouth: z.number(),
    boundsEast: z.number(),
    boundsWest: z.number(),
    metadata: z.array(RoutePointSchema),
    createdAt: z.date(),
    updatedAt: z.date().nullable()
});

export const CreateRouteSchema = RouteSchema.omit({
    id: true,
    distanceMeters: true,
    boundsNorth: true,
    boundsSouth: true,
    boundsEast: true,
    boundsWest: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
});

export const UpdateRouteSchema = RouteSchema.omit({
    id: true,
    distanceMeters: true,
    boundsNorth: true,
    boundsSouth: true,
    boundsEast: true,
    boundsWest: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
}).partial();

export type Route = z.infer<typeof RouteSchema>;
export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
