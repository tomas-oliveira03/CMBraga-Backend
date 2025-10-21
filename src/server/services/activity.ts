import { ActivityMode } from "@/helpers/types";

const WALKING_SPEED = 0.8;          // 0.8 m/s
const BIKING_SPEED = 2.2;           // 2.2 m/s

export function calculateTimeUntilArrival(
        distanceFromLastStop: number, 
        activityMode: ActivityMode, 
    ): number {

    if (distanceFromLastStop <= 0) return 0;

    const speed = activityMode === ActivityMode.WALK ? WALKING_SPEED : BIKING_SPEED;
    const timeSeconds = distanceFromLastStop / speed;
    const timeMinutes = timeSeconds / 60;

    return Math.round(timeMinutes);
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