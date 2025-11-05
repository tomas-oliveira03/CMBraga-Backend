import { Station } from "@/db/entities/Station";
import { StationType, TypeOfChat, UserNotificationType } from "./types";

export enum WebSocketEvent {
    NEW_MESSAGE = 'newMessage',
    CONNECTION_STATUS = 'connectionStatus',
    ACTIVITY_STARTED = 'activityStarted',
    ACTIVITY_ENDED = 'activityEnded',
    CHECK_IN = 'checkIn',
    CHECK_OUT = 'checkOut',
    NEXT_STOP = 'nextStop',
    ARRIVED_AT_STOP = 'arrivedAtStop',
    NOTIFICATION = 'notification'
}

export enum ConnectionStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected'
}

export enum RequestType {
    ADD = 'ADD',
    REMOVE = 'REMOVE'
}

export enum ClientType {
    PARENT = 'PARENT',
    CHILD = 'CHILD'
}

export type WebSocketMessage =
    { 
        event: WebSocketEvent.NEW_MESSAGE;
        data: {
            sender: {
                id: string;
                name: string;
                profilePictureURL: string;
            };
            chat: {
                id: string;
                type: TypeOfChat;
                name: string | null;
            };
            message: string;
        };
        timestamp: Date; 
    }
    | 
    { 
        event: WebSocketEvent.CONNECTION_STATUS; 
        data: {
            status: ConnectionStatus;
            message: string;
        };
        timestamp: Date;
    }
    | 
    { 
        event: WebSocketEvent.ACTIVITY_STARTED; 
        data: {
            activitySessionId: string;
        }; 
        timestamp: Date 
    }
    | 
    { 
        event: WebSocketEvent.ACTIVITY_ENDED; 
        data: {
            activitySessionId: string;
        }; 
        timestamp: Date 
    }
    | 
    { 
        event: WebSocketEvent.CHECK_IN; 
        data: {
            activitySessionId: string;
            requestType: RequestType;
            clientType: ClientType;
            clientId: string;
        }; 
        timestamp: Date 
    }
    | 
    { 
        event: WebSocketEvent.CHECK_OUT; 
        data: {
            activitySessionId: string;
            requestType: RequestType;
            childId: string;
        }; 
        timestamp: Date 
    }
    | 
    { 
        event: WebSocketEvent.NEXT_STOP; 
        data: {
            activitySessionId: string;
            stationData: {
                id: string;
                name: string;
                type: StationType;
                latitude: number;
                longitude: number;
            };
        }; 
        timestamp: Date 
    }
    | 
    { 
        event: WebSocketEvent.ARRIVED_AT_STOP; 
        data: {
            activitySessionId: string;
            stationData: {
                id: string;
                name: string;
                type: StationType;
                latitude: number;
                longitude: number;
                isLastStation: boolean;
            };
        }; 
        timestamp: Date 
    }
    | 
    { 
        event: WebSocketEvent.NOTIFICATION; 
        data: {
            notificationId: string;
            type: UserNotificationType;
            title: string;
            description: string;
            uri: string;
        }; 
        timestamp: Date 
    };