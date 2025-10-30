import { ActivityMode, ActivityType } from "./types";

export interface ActivitySessionInfo {
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

export interface BundleActivityPayload {
    type: "bundle";
    activities: ActivitySessionInfo[];
}

export interface SingleActivityPayload extends ActivitySessionInfo {
    type: "single";
}

export type UpcomingActivityPayload = BundleActivityPayload | SingleActivityPayload;
