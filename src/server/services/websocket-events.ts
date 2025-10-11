import { webSocketManager } from "./websocket";

export enum WebSocketEvent {
    NEW_MESSAGE = 'newMessage',
    NEW_NOTIFICATION = 'newNotification',
    CONNECTION_STATUS = 'connectionStatus'
}

export interface WebSocketMessage {
    event: WebSocketEvent;
    data: any;
    timestamp: Date;
}


// Send message when user connects to WebSocket
export function userConnectedToWebsocket (userId: string) {
    webSocketManager.sendToUser(userId, {
        event: WebSocketEvent.CONNECTION_STATUS,
        data: {
            status: 'connected',
            message: 'WebSocket connection established successfully',
        },
        timestamp: new Date()
    });
}




