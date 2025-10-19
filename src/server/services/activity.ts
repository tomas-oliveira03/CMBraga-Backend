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


const DEFAULT_CHILD_WEIGHT_KG = 35;

export function calculateCaloriesBurned(
        distanceMeters: number, 
        timeSeconds: number, 
        activityType: ActivityMode
    ): number {

  if (distanceMeters <= 0 || timeSeconds <= 0) return 0;

  const timeHours = timeSeconds / 3600;

  const MET = activityType === ActivityMode.WALK ? 2.5 : 4.0;

  const calories = MET * DEFAULT_CHILD_WEIGHT_KG * timeHours;

  return Math.round(calories); 
}


const CO2_PER_KM_GRAMS = 120;

export function calculateCO2Saved(distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;

  const distanceKm = distanceMeters / 1000;
  const co2Saved = distanceKm * CO2_PER_KM_GRAMS;

  return Math.round(co2Saved);
}