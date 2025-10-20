import { ConnectionStatus, WebSocketEvent } from "@/helpers/websocket-types";
import { webSocketManager } from "./websocket";

// Send message when user connects to WebSocket
export function userConnectedToWebsocket (userId: string) {
    const message = {
        event: WebSocketEvent.CONNECTION_STATUS as WebSocketEvent.CONNECTION_STATUS,
        data: {
            status: ConnectionStatus.CONNECTED,
            message: 'WebSocket connection established successfully',
        },
        timestamp: new Date()
    };

    webSocketManager.sendToUser(userId, message)
}


// Add new chatRoom
export function addNewChatRoom(chatId: string, userIds: string[]) {
    webSocketManager.addChatRoom(chatId, userIds);
}


// Send message to chatRoom
export function sendMessageToChatRoom(chatId: string, senderId: string) {
    const message = {
        event: WebSocketEvent.NEW_MESSAGE as WebSocketEvent.NEW_MESSAGE,
        data: {
            sender: {
                id: senderId,
                name: "NAME",
                profilePictureURL: "PROFILE_PICTURE_URL"
            },
            chatId: chatId,
            message: 'Hello, this is a message to the chat room!',
        },
        timestamp: new Date()
    };

    webSocketManager.sendToChatRoom(chatId, senderId, message);
}




