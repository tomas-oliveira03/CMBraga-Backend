import { AppDataSource } from "@/db";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { RouteStation } from "@/db/entities/RouteStation";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { ChildStationType } from "@/helpers/types";
import { logger } from "@/lib/logger";
import { calculateCaloriesBurned, calculateCO2Saved, calculatePointsEarned } from "./activity";
import { Child } from "@/db/entities/Child";
import { ParentChild } from "@/db/entities/ParentChild";
import { ParentStation } from "@/db/entities/ParentStation";
import { ParentStat } from "@/db/entities/ParentStat";
import { ChildStat } from "@/db/entities/ChildStat";

export async function setActivityStats(activityId: string){
    try{
        const activity = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activityId },
            relations: {
                childStations: true
            }
        })
        if (!activity) {
            throw new Error("Activity not found");
        }

        // Join station activity sessions with route stations
        const stationData = await AppDataSource.getRepository(StationActivitySession)
            .createQueryBuilder("sas")
            .innerJoin(RouteStation, "rs", "rs.station_id = sas.station_id AND rs.route_id = :routeId", { routeId: activity.routeId })
            .select([
                "sas.station_id",
                "sas.arrived_at", 
                "sas.left_at",
                "rs.distance_from_start_meters"
            ])
            .where("sas.activity_session_id = :activityId", { activityId })
            .getRawMany();
            
        // Create a map where key is station ID and value contains timing and distance info
        const stationInfoMap = new Map<string, { arrivedAt: Date; leftAt: Date; distanceFromStartMeters: number }>();
        stationData.forEach(data => {
            stationInfoMap.set(data.station_id, {
                arrivedAt: data.arrived_at,
                leftAt: data.left_at,
                distanceFromStartMeters: data.distance_from_start_meters
            });
        });

        // Create a map where key is child ID and value is object with pickup and dropoff station IDs
        const childStationsMap = new Map<string, { pickupStationId: string | null; dropoffStationId: string | null }>();
        activity.childStations.forEach(cs => {
            if (!childStationsMap.has(cs.childId)) {
                childStationsMap.set(cs.childId, { pickupStationId: null, dropoffStationId: null });
            }
            const childStation = childStationsMap.get(cs.childId)!;
            if (cs.type === ChildStationType.IN) {
                childStation.pickupStationId = cs.stationId;
            } else if (cs.type === ChildStationType.OUT) {
                childStation.dropoffStationId = cs.stationId;
            }
        });

        // Filter to only include children with both IN and OUT stations
        const completeChildStationsMap = new Map<string, { pickupStationId: string; dropoffStationId: string }>();
        childStationsMap.forEach((stations, childId) => {
            if (stations.pickupStationId && stations.dropoffStationId) {
                completeChildStationsMap.set(childId, {
                    pickupStationId: stations.pickupStationId,
                    dropoffStationId: stations.dropoffStationId
                });
            }
        });

        const activityMode = activity.mode
        const activityDate = activity.scheduledAt!
        const insertedClientStatIds: string[] = [];
        const activitySessionWeatherType = activity.weatherType;

        for (const [childId, stations] of completeChildStationsMap){
            const pickUpStation = stationInfoMap.get(stations.pickupStationId);
            const dropOffStation = stationInfoMap.get(stations.dropoffStationId);

            const child = await AppDataSource.getRepository(Child).findOne({
                where: {
                    id: childId
                }
            })

            if(!child){
                throw new Error("Child not found");
            }
        
            if (pickUpStation && dropOffStation) {
                let educatorsInvolvedIds: string[] = [];
                const parentChildRelations = await AppDataSource.getRepository(ParentChild).find({
                    where: { childId: childId }
                });
                if (parentChildRelations && parentChildRelations.length > 0) {
                    for (const pc of parentChildRelations) {
                        const parentActivity = await AppDataSource.getRepository(ParentStation).findOne({
                            where: {
                                parentId: pc.parentId,
                                activitySessionId: activityId
                            }
                        });
                        if (parentActivity) {
                            educatorsInvolvedIds.push(pc.parentId);
                        }
                    }
                }
                const distanceMeters = Math.abs(dropOffStation.distanceFromStartMeters - pickUpStation.distanceFromStartMeters);
                const durationSeconds = Math.abs(dropOffStation.arrivedAt.getTime() - pickUpStation.leftAt.getTime()) / 1000;
                const caloriesBurned = calculateCaloriesBurned(distanceMeters, durationSeconds, activityMode, child);
                const co2Saved = calculateCO2Saved(distanceMeters);
                const pointsEarned = calculatePointsEarned(distanceMeters, activitySessionWeatherType ?? undefined, educatorsInvolvedIds.length > 0, 0);

                // Insert one-by-one and capture the inserted id
                const clientStatPayload = {
                    distanceMeters: distanceMeters,
                    co2Saved: co2Saved,
                    caloriesBurned: caloriesBurned,
                    pointsEarned: pointsEarned,
                    activityDate: activityDate,
                    activitySessionId: activity.id,
                    childId: childId
                };

                const insertResult = await AppDataSource.getRepository(ChildStat).insert(clientStatPayload);
                const insertedId = insertResult.identifiers?.[0]?.id;

                if ( educatorsInvolvedIds.length > 0) {
                    for (const parentId of educatorsInvolvedIds) {
                        const parentStatPayload = {
                            clientStatId: insertedId,
                            parentId: parentId
                        };
                        await AppDataSource.getRepository(ParentStat).insert(parentStatPayload);
                    }
                }

                if (insertedId) {
                    insertedClientStatIds.push(insertedId);
                } else {
                    logger.debug("ClientStat insert returned no id for child:", childId);
                }
            }
        }
        if (insertedClientStatIds.length > 0) {
            logger.info(`Inserted ${insertedClientStatIds.length} client stats: ${insertedClientStatIds.join(',')}`);
        } else {
            logger.info("No client stats were inserted for activity " + activityId);
        }
    }
    catch(error){
        logger.error(error instanceof Error ? error.message : String(error) ) 
    }

}
