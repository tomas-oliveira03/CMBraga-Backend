import { AppDataSource } from "@/db";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { logger } from "@/lib/logger";

export async function setActivityStats(activityId: string){
    try{
        const activity = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activityId },
            relations: {
                childStations: true,
                stationActivitySessions: true
            }
        })

        if (!activity) {
            throw new Error("Activity not found");
        }

    }
    catch(error){
        logger.error(error instanceof Error ? error.message : String(error) ) 
    }

}
