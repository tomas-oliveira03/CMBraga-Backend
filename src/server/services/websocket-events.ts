import { ConnectionStatus, WebSocketEvent } from "@/helpers/websocket-types";
import { webSocketManager } from "./websocket";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import { logger } from "@/lib/logger";
import { TypeOfChat } from "@/helpers/types";

// Send message when user connects to WebSocket
export function userConnectedToWebsocket (userId: string) {
    try {
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
    catch(error){
        console.error(error instanceof Error ? error.message : String(error))
    }
}


// Add new chatRoom
export function addNewChatRoom(chatId: string, userIds: string[]) {
    webSocketManager.addChatRoom(chatId, userIds);
}


// Send message to chatRoom
export async function sendMessageToChatRoom(chatId: string, chatType: TypeOfChat, chatName: string | null, senderId: string, messageContent: string) {
    try {
        const user = await AppDataSource.getRepository(User).findOne({
            where: {
                id: senderId
            }
        })
        if (!user){
            logger.error(`User id ${senderId} not found`)
            return
        }

        const message = {
            event: WebSocketEvent.NEW_MESSAGE as WebSocketEvent.NEW_MESSAGE,
            data: {
                sender: {
                    id: senderId,
                    name: user.name,
                    profilePictureURL: user.profilePictureURL
                },
                chat: {
                    id: chatId,
                    type: chatType,
                    name: chatName
                },
                message: messageContent,
            },
            timestamp: new Date()
        };

        webSocketManager.sendToChatRoom(chatId, senderId, message);

    }
    catch(error){
        console.error(error instanceof Error ? error.message : String(error))
    }
}







