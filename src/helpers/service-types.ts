import { ActivityMode, ActivityType, WeatherType } from "./types";

// UPCOMING
export interface UpcomingActivitySessionInfo {
    activitySessionId: string;
    isLateRegistration: boolean;
    registeredAt: Date;
    activitySession: {
        type: ActivityType;
        mode: ActivityMode;
        scheduledAt: Date;
        expectedDepartureAt: Date;
        expectedArrivalAt: Date;
    };
    route: {
        id: string;
        name: string;
    };
    pickUpStation: {
        id: string;
        name: string;
    };
    dropOffStation: {
        id: string;
        name: string;
    };
    registeredBy: {
        id: string;
        name: string;
    };
    chainedInfo: string | null;
}

export interface UpcomingBundleActivityPayload {
    type: "bundle";
    activities: UpcomingActivitySessionInfo[];
}

export interface UpcomingSingleActivityPayload extends UpcomingActivitySessionInfo {
    type: "single";
}

export type UpcomingActivityPayload = UpcomingBundleActivityPayload | UpcomingSingleActivityPayload;


// PREVIOUS
export interface PreviousActivitySessionInfo {
    activitySessionId: string;
    isLateRegistration: boolean;
    registeredAt: Date;
    activitySession: {
        type: ActivityType;
        mode: ActivityMode;
        startedAt: Date;
        departuredAt: Date;
        arrivedAt: Date;
        weatherTemperature: number | null
        weatherType: WeatherType | null
    };
    route: {
        id: string;
        name: string;
    };
    pickUpStation: {
        id: string;
        name: string;
    };
    dropOffStation: {
        id: string;
        name: string;
    };
    registeredBy: {
        id: string;
        name: string;
    };
    stats: {
        distanceMeters: number;
        co2Saved: number;
        caloriesBurned: number;
        pointsEarned: number;
    };
    chainedInfo: string | null;
}

export interface PreviousBundleActivityPayload {
    type: "bundle";
    activities: PreviousActivitySessionInfo[];
}

export interface PreviousSingleActivityPayload extends PreviousActivitySessionInfo {
    type: "single";
}

export type PreviousActivityPayload = PreviousBundleActivityPayload | PreviousSingleActivityPayload;