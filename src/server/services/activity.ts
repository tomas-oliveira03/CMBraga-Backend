import { ActivityMode, ChildGender } from "@/helpers/types";
import { differenceInYears } from "date-fns";

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


/**
 * Calculate calories burned using MET (Metabolic Equivalent of Task) method
 * Formula: Calories = MET × weight(kg) × time(hours)
 * 
 * MET values for children:
 * - Walking (slow pace): 3.0
 * - Walking (moderate pace): 3.5
 * - Biking (leisure): 4.0
 * - Biking (moderate): 6.0
 */
export function calculateCaloriesBurned(
    distanceMeters: number, 
    timeSeconds: number, 
    activityType: ActivityMode,
    childData: {
        weightKilograms: number;
        heightCentimeters: number;
        dateOfBirth: Date;
        gender: ChildGender;
    }
): number {

    if (distanceMeters <= 0 || timeSeconds <= 0) return 0;

    const timeHours = timeSeconds / 3600;
    const speedKmh = (distanceMeters / 1000) / timeHours;

    // Calculate age-adjusted MET based on activity type and speed
    let met: number;
    
    if (activityType === ActivityMode.WALK) {
        // Walking MET values based on speed
        if (speedKmh < 3) {
            met = 2.5; // Very slow walking
        } else if (speedKmh < 4) {
            met = 3.0; // Slow walking
        } else if (speedKmh < 5) {
            met = 3.5; // Moderate walking
        } else {
            met = 4.0; // Brisk walking
        }
    } else {
        // Biking MET values based on speed
        if (speedKmh < 10) {
            met = 4.0; // Leisure biking
        } else if (speedKmh < 16) {
            met = 6.0; // Moderate biking
        } else {
            met = 8.0; // Vigorous biking
        }
    }

    // Age adjustment factor (children have higher metabolic rates)
    const age = differenceInYears(new Date(), childData.dateOfBirth);
    let ageMultiplier = 1.0;
    
    if (age < 8) {
        ageMultiplier = 1.2; // Young children burn more calories
    } else if (age < 12) {
        ageMultiplier = 1.1;
    } else if (age < 15) {
        ageMultiplier = 1.05;
    }

    // Calculate calories using standard MET formula with age adjustment
    const calories = met * childData.weightKilograms * timeHours * ageMultiplier;

    return Math.round(calories); 
}


const CO2_PER_KM_GRAMS = 120;

export function calculateCO2Saved(distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;

  const distanceKm = distanceMeters / 1000;
  const co2Saved = distanceKm * CO2_PER_KM_GRAMS;

  return Math.round(co2Saved);
}


const child = {
    weightKilograms: 25,
    heightCentimeters: 120,
    dateOfBirth: new Date(2015, 2, 1),
    gender: ChildGender.MALE
}

const caloriesBurned = calculateCaloriesBurned(1000, 360, ActivityMode.WALK, child);
console.log(caloriesBurned)