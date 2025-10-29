import { AppDataSource } from "@/db";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Route } from "@/db/entities/Route";
import { RouteConnection } from "@/db/entities/RouteConnection";
import { Between, IsNull } from "typeorm";

interface LinkedActivitiesResult {
  previousActivityId: string | null;
  nextActivityId: string | null;
}

// Fetch all activities for a route on the same calendar day
async function getActivitiesForRouteOnDay(routeId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return AppDataSource.getRepository(ActivitySession).find({
    where: {
        routeId: routeId,
        scheduledAt: Between(startOfDay, endOfDay),
        startedAt: IsNull()
    },
  });
}

// Compute timestamp of a station based on route start and offset minutes
function getStationTime(baseTime: Date, offsetMinutes: number) {
  return new Date(baseTime.getTime() + offsetMinutes * 60 * 1000);
}

/**
 * Finds previous and next linked activities (if any) for a given route and date.
 * - "previous" = activity from a backward linked route whose transfer stop is ≤ 20min before this route’s transfer stop.
 * - "next" = activity from a forward linked route whose transfer stop is ≤ 20min after this route’s transfer stop.
 */
export async function findLinkedActivities(
  route: Route,
  validatedData: {
    routeId: string;
    scheduledAt: Date;
  }
): Promise<LinkedActivitiesResult> {
  let previousActivityId: string | null = null;
  let nextActivityId: string | null = null;

  // --- Forward link (A → B) ---
  const forwardLink = await AppDataSource.getRepository(RouteConnection).findOne({
    where: { fromRouteId: validatedData.routeId },
  });

  if (forwardLink) {
    const { stationId: linkageStationId, toRouteId: linkedRouteId } = forwardLink;

    const linkedActivities = await getActivitiesForRouteOnDay(linkedRouteId, validatedData.scheduledAt);
    
    const thisStop = route.routeStations.find(rs => rs.stationId === linkageStationId);

    if (thisStop) {
      const thisStopTime = getStationTime(validatedData.scheduledAt, thisStop.timeFromStartMinutes);
      
      for (const linkedActivity of linkedActivities) {
        const linkedRoute = await AppDataSource.getRepository(Route).findOne({
          where: { id: linkedActivity.routeId },
          relations: { routeStations: true },
        });
        if (!linkedRoute) continue;

        const linkedStop = linkedRoute.routeStations.find(rs => rs.stationId === linkageStationId);
        if (!linkedStop) continue;

        const linkedStopTime = getStationTime(linkedActivity.scheduledAt, linkedStop.timeFromStartMinutes);
        const diffMinutes = (linkedStopTime.getTime() - thisStopTime.getTime()) / 60000;
        console.log(diffMinutes)
        if (diffMinutes >= 0 && diffMinutes <= 20) {
          nextActivityId = linkedActivity.id;
          break;
        }
      }
    }
  }

  // --- Backward link (B → A) ---
  const backwardLink = await AppDataSource.getRepository(RouteConnection).findOne({
    where: { toRouteId: validatedData.routeId },
  });

  if (backwardLink) {
    const { stationId: linkageStationId, fromRouteId: linkedRouteId } = backwardLink;

    const linkedActivities = await getActivitiesForRouteOnDay(linkedRouteId, validatedData.scheduledAt);

    const thisStop = route.routeStations.find(rs => rs.stationId === linkageStationId);
    if (thisStop) {
      const thisStopTime = getStationTime(validatedData.scheduledAt, thisStop.timeFromStartMinutes);
      for (const linkedActivity of linkedActivities) {
        const linkedRoute = await AppDataSource.getRepository(Route).findOne({
          where: { id: linkedActivity.routeId },
          relations: { routeStations: true },
        });
        if (!linkedRoute) continue;

        const linkedStop = linkedRoute.routeStations.find(rs => rs.stationId === linkageStationId);
        if (!linkedStop) continue;

        const linkedStopTime = getStationTime(linkedActivity.scheduledAt, linkedStop.timeFromStartMinutes);
        const diffMinutes = (thisStopTime.getTime() - linkedStopTime.getTime()) / 60000;
        if (diffMinutes >= 0 && diffMinutes <= 20) {
          previousActivityId = linkedActivity.id;
          break;
        }
      }
    }
  }

  return { previousActivityId, nextActivityId };
}
