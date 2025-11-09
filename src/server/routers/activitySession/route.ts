import { AppDataSource } from "@/db";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Route } from "@/db/entities/Route";
import express, { Request, Response } from "express";

const router = express.Router();

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: {
                id: activitySessionId
            },
            relations: {
                activityTransfer: true
            }
        });
        if (!activitySession){
            return res.status(404).json({ message: "Activity session not found" })
        }

        const routeId = activitySession.routeId
        const connectorRouteId = activitySession.activityTransfer?.routeId

        const route = await AppDataSource.getRepository(Route).findOne({
            where: {
                id: routeId
            },
            relations: {
                routeStations: {
                    station: true
                },
                fromRouteConnections: {
                    toRoute: {
                        routeStations: {
                            station: true
                        }
                    },
                    station: true
                }
            }
        });
        if (!route){
            return res.status(404).json({ message: "Route not found" })
        }

        const bounds = {
            north: route.boundsNorth,
            east: route.boundsEast,
            south: route.boundsSouth,
            west: route.boundsWest
        };

        const stops = route.routeStations
            .map(rs => ({
                stationId: rs.stationId,
                stopNumber: rs.stopNumber,
                scheduledTime: new Date(activitySession.scheduledAt.getTime() + rs.timeFromStartMinutes * 60000),
                distanceFromPreviousStationMeters: rs.distanceFromPreviousStationMeters,
                name: rs.station.name,
                type: rs.station.type,
                latitude: rs.station.latitude,
                longitude: rs.station.longitude,
            }))
            .sort((a, b) => a.stopNumber - b.stopNumber);

        let response = {
            id: route.id,
            activitySessionId: activitySessionId,
            name: route.name,
            activityType: route.activityType,
            scheduledAt: activitySession.scheduledAt,
            route: route.metadata,
            bounds: bounds,
            stops: stops,
            connector: undefined as any
        };

        // Add route connector logic if available
        if(route.fromRouteConnections && route.fromRouteConnections[0] && route.fromRouteConnections[0].toRouteId === connectorRouteId){
            const firstConnectorRoute = route.fromRouteConnections[0]

            // Get the connector's scheduled time from the transfer activity session
            const connectorScheduledTime = activitySession.activityTransfer?.scheduledAt || activitySession.scheduledAt;

            const connectorStops = firstConnectorRoute.toRoute.routeStations
                .map(rs => ({
                    stationId: rs.stationId,
                    stopNumber: rs.stopNumber,
                    scheduledTime: new Date(connectorScheduledTime.getTime() + rs.timeFromStartMinutes * 60000),
                    distanceFromPreviousStationMeters: rs.distanceFromPreviousStationMeters,
                    name: rs.station.name,
                    type: rs.station.type,
                    latitude: rs.station.latitude,
                    longitude: rs.station.longitude,
                }))
                .sort((a, b) => a.stopNumber - b.stopNumber)
                .filter((rs, i, arr) => {
                    const startIndex = arr.findIndex(s => s.stationId === firstConnectorRoute.station.id);
                    return i > startIndex; 
                });

            response.connector = {
                connectorStation: {
                    id: firstConnectorRoute.station.id,
                    name: firstConnectorRoute.station.name
                },
                connectorRoute: {
                    id: firstConnectorRoute.toRoute.id,
                    name: firstConnectorRoute.toRoute.name,
                    activityType: firstConnectorRoute.toRoute.activityType,
                    distanceMeters: firstConnectorRoute.toRoute.distanceMeters,
                    createdAt: firstConnectorRoute.toRoute.createdAt,
                    updatedAt: firstConnectorRoute.toRoute.updatedAt,
                    route: firstConnectorRoute.toRoute.metadata,
                    stops: connectorStops,
                }
            }
        }

        return res.status(200).json(response);
        
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
