import { AppDataSource } from "@/db";
import { Route } from "@/db/entities/Route";
import { RouteStation } from "@/db/entities/RouteStation";


export async function findTransferStation(
    pickupRouteId: string,
    dropoffRouteId: string,
): Promise<string | null> {
    const pickupRouteStations = await AppDataSource.getRepository(RouteStation).find({
        where: { routeId: pickupRouteId },
        order: { stopNumber: 'ASC' }
    });

    const dropoffRouteStations = await AppDataSource.getRepository(RouteStation).find({
        where: { routeId: dropoffRouteId },
        order: { stopNumber: 'ASC' }
    });



    const commonStations = pickupRouteStations.filter(station => dropoffRouteStations.some(ds => ds.stationId === station.stationId));;
    if (commonStations.length === 0) {
        return null;
    }

    return commonStations[0]!.stationId || null;
}

export async function validateRouteTransfer(
    activitySessionId: string,
    pickupStationId: string,
    dropoffStationId: string
): Promise<{ 
    isValid: boolean; 
    transferStationId: string | null; 
    requiresTransfer: boolean;
    message?: string;
}> {
    const activitySession = await AppDataSource.getRepository(Route).findOne({
        where: { 
            activitySessions: { 
                id: activitySessionId 
            } 
        },
        relations: {
            routeStations: true
        }
    });

    if (!activitySession) {
        return { 
            isValid: false, 
            transferStationId: null, 
            requiresTransfer: false,
            message: "Activity route not found" 
        };
    }

  
    const activityStationIds = activitySession.routeStations.map(rs => rs.stationId);

    const pickupInRoute = activityStationIds.includes(pickupStationId);
    const dropoffInRoute = activityStationIds.includes(dropoffStationId);

    if (pickupInRoute && dropoffInRoute) {
        return { 
            isValid: true, 
            transferStationId: null, 
            requiresTransfer: false 
        };
    }


    const dropoffRoute = await AppDataSource.getRepository(Route).findOne({
        where: { 
            routeStations: { 
                stationId: dropoffStationId 
            } 
        },
        relations: {
            routeStations: true
        }
    });

    if (!dropoffRoute) {
        return { 
            isValid: false, 
            transferStationId: null, 
            requiresTransfer: false,
            message: "Drop-off station route not found" 
        };
    }

    const transferStationId = await findTransferStation(
        activitySession.id,
        dropoffRoute.id     
    );

    if (!transferStationId) {
        return { 
            isValid: false, 
            transferStationId: null, 
            requiresTransfer: true,
            message: "No transfer station found between routes" 
        };
    }

    return { 
        isValid: true, 
        transferStationId, 
        requiresTransfer: true 
    };
}
