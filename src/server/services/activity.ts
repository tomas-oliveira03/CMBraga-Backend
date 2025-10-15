import { ActivityMode } from "@/helpers/types";

const WALKING_SPEED = 0.8;          // 0.8 m/s
const BIKING_SPEED = 2.2;           // 2.2 m/s
const WAIT_TIME_PER_STOP = 2 * 60;  // 2 minutes in seconds

export function calculateScheduledTime(
        distanceFromOrigin: number, 
        scheduledAtTime: Date, 
        activityType: ActivityMode, 
        previousStops: number
    ): Date {

    // Choose the right speed
    const speed = activityType === ActivityMode.WALK ? WALKING_SPEED : BIKING_SPEED;

    // Calculate travel time (seconds)
    const travelTimeInSeconds = distanceFromOrigin / speed;

    // Add waiting time for previous stops
    const totalWaitTimeInSeconds = previousStops * WAIT_TIME_PER_STOP;

    // Compute final arrival time
    const totalTimeInMs = (travelTimeInSeconds + totalWaitTimeInSeconds) * 1000;

    // Compute final date
    const finalDate = new Date(scheduledAtTime.getTime() + totalTimeInMs);

    // Normalize milliseconds to zero (avoid showing fractions of seconds)
    finalDate.setMilliseconds(0);

    return finalDate;
}
