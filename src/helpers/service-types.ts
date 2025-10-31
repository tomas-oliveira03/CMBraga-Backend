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
        finishedAt: Date;
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
        distanceMeters: number | null;
        co2Saved: number | null;
        caloriesBurned: number | null;
        pointsEarned: number | null;
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


// ONGOING
export interface OngoingActivitySessionInfo {
    activitySessionId: string;
    isLateRegistration: boolean;
    registeredAt: Date;
    activitySession: {
        type: ActivityType;
        mode: ActivityMode;
        startedAt: Date;
        expectedDepartureAt: Date;
        departuredAt: Date | null; 
        expectedArrivalAt: Date;
        arrivedAt: Date | null; 
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
    chainedInfo: string | null;
}

export interface OngoingBundleActivityPayload {
    type: "bundle";
    activities: OngoingActivitySessionInfo[];
}

export interface OngoingSingleActivityPayload extends OngoingActivitySessionInfo {
    type: "single";
}

export type OngoingActivityPayload = OngoingBundleActivityPayload | OngoingSingleActivityPayload;