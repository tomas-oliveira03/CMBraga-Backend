import { z } from "zod";
import { ActivityTypeEnum } from "./activitySession";
import { StationTypeEnum } from "./station";
import { RouteColor } from "@/helpers/types";

export const RouteColorEnum = z.enum([RouteColor.RED, RouteColor.BLUE, RouteColor.GREEN, RouteColor.YELLOW, RouteColor.ORANGE, RouteColor.PURPLE, RouteColor.PINK, RouteColor.BROWN]);

export const RoutePointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const RouteSchema = z.object({
    id: z.string(),
    name: z.string(),
    activityType: ActivityTypeEnum,
    color: RouteColorEnum,
    distanceMeters: z.number(),
    boundsNorth: z.number(),
    boundsSouth: z.number(),
    boundsEast: z.number(),
    boundsWest: z.number(),
    metadata: z.array(RoutePointSchema),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    routeConnector: z.object({
        routeId: z.string(),
        stationId: z.string()
    }).nullable()
});

export const InitialUpdateSchema = z.array(z.object({
    stationId: z.string(),
    type: StationTypeEnum,
    timeFromStartMinutes: z.number()
}));

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
    routeConnector: true
});

export const UpdateRouteSchema = RouteSchema.omit({
    id: true,
    distanceMeters: true,
    activityType: true,
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
export type InitialUpdateRouteInput = z.infer<typeof InitialUpdateSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
