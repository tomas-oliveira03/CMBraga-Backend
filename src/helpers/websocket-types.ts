export enum WebSocketEvent {
    NEW_MESSAGE = 'newMessage',
    CONNECTION_STATUS = 'connectionStatus'
}

export enum ConnectionStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected'
}

interface NewMessageData {
    sender: {
        id: string;
        name: string;
        profilePictureURL: string;
    };
    chatId: string;
    message: string;
}

export interface ConnectionStatusData {
    status: ConnectionStatus;
    message: string;
}


export type WebSocketMessage =
    | { 
        event: WebSocketEvent.NEW_MESSAGE;
        data: NewMessageData; 
        timestamp: Date 
    }
    | { 
        event: WebSocketEvent.CONNECTION_STATUS; 
        data: ConnectionStatusData; 
        timestamp: Date 
    };