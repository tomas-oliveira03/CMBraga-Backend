import { ClientType, ConnectionStatus, RequestType, WebSocketEvent } from "@/helpers/websocket-types";
import { webSocketManager } from "./websocket";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import { logger } from "@/lib/logger";
import { StationType, TypeOfChat, UserNotificationType } from "@/helpers/types";
import { getAllInstructorsInActivityToNotify } from "./activity";


class WebSocketEvents {

    // Send message when user connects to WebSocket
    userConnectedToWebsocket(userId: string) {
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
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Add new chatRoom
    addNewChatRoom(chatId: string, userIds: string[]) {
        webSocketManager.addChatRoom(chatId, userIds);
    }


    // Add user to chatRoom
    addNewUserToChatRoom(chatId: string, userId: string) {
        webSocketManager.addUserToChatRoom(chatId, userId);
    }
    

    // Send message to chatRoom
    async sendMessageToChatRoom(chatId: string, chatType: TypeOfChat, chatName: string | null, senderId: string, messageContent: string) {
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
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Send activity started event
    async sendActivityStarted(activitySessionId: string, senderInstructorId: string) {
        try {
            const message = {
                event: WebSocketEvent.ACTIVITY_STARTED as WebSocketEvent.ACTIVITY_STARTED,
                data: {
                    activitySessionId: activitySessionId
                },
                timestamp: new Date()
            };

            const usersToNotify = await getAllInstructorsInActivityToNotify(activitySessionId, senderInstructorId)

            webSocketManager.sendToUsers(usersToNotify, message);
        }
        catch(error){
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Send activity ended event
    async sendActivityEnded(activitySessionId: string, senderInstructorId: string) {
        try {
            const message = {
                event: WebSocketEvent.ACTIVITY_ENDED as WebSocketEvent.ACTIVITY_ENDED,
                data: {
                    activitySessionId: activitySessionId
                },
                timestamp: new Date()
            };

            const usersToNotify = await getAllInstructorsInActivityToNotify(activitySessionId, senderInstructorId)

            webSocketManager.sendToUsers(usersToNotify, message);
        }
        catch(error){
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Send activity checked in event
    async sendActivityCheckedIn(activitySessionId: string, senderInstructorId: string, requestType: RequestType, clientType: ClientType, clientId: string) {
        try {
            const message = {
                event: WebSocketEvent.CHECK_IN as WebSocketEvent.CHECK_IN,
                data: {
                    activitySessionId: activitySessionId,
                    requestType: requestType,
                    clientType: clientType,
                    clientId: clientId
                },
                timestamp: new Date()
            };

            const usersToNotify = await getAllInstructorsInActivityToNotify(activitySessionId, senderInstructorId)

            webSocketManager.sendToUsers(usersToNotify, message);
        }
        catch(error){
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Send activity checked out event
    async sendActivityCheckedOut(activitySessionId: string, senderInstructorId: string, requestType: RequestType, childId: string) {
        try {
            const message = {
                event: WebSocketEvent.CHECK_OUT as WebSocketEvent.CHECK_OUT,
                data: {
                    activitySessionId: activitySessionId,
                    requestType: requestType,
                    childId: childId
                },
                timestamp: new Date()
            };

            const usersToNotify = await getAllInstructorsInActivityToNotify(activitySessionId, senderInstructorId)

            webSocketManager.sendToUsers(usersToNotify, message);
        }
        catch(error){
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Send activity next stop event
    async sendActivityNextStop(activitySessionId: string, senderInstructorId: string, stationData: {
        id: string;
        name: string;
        type: StationType;
        latitude: number;
        longitude: number;
    }) {
        try {
            const message = {
                event: WebSocketEvent.NEXT_STOP as WebSocketEvent.NEXT_STOP,
                data: {
                    activitySessionId: activitySessionId,
                    stationData: stationData
                },
                timestamp: new Date()
            };

            const usersToNotify = await getAllInstructorsInActivityToNotify(activitySessionId, senderInstructorId)

            webSocketManager.sendToUsers(usersToNotify, message);
        }
        catch(error){
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Send activity arrived at stop event
    async sendActivityArrivedAtStop(activitySessionId: string, senderInstructorId: string, stationData: {
        id: string;
        name: string;
        type: StationType;
        latitude: number;
        longitude: number;
        isLastStation: boolean;
    }) {
        try {
            const message = {
                event: WebSocketEvent.ARRIVED_AT_STOP as WebSocketEvent.ARRIVED_AT_STOP,
                data: {
                    activitySessionId: activitySessionId,
                    stationData: stationData
                },
                timestamp: new Date()
            };

            const usersToNotify = await getAllInstructorsInActivityToNotify(activitySessionId, senderInstructorId)

            webSocketManager.sendToUsers(usersToNotify, message);
        }
        catch(error){
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }


    // Send user notification event
    async sendUserNotification(userToNotify: string, notification: {
        notificationId: string;
        type: UserNotificationType;
        title: string;
        description: string;
        uri: string | null;
    }) {
        try {
            const message = {
                event: WebSocketEvent.NOTIFICATION as WebSocketEvent.NOTIFICATION,
                data: {
                    notificationId: notification.notificationId,
                    type: notification.type,
                    title: notification.title,
                    description: notification.description,
                    uri: notification.uri
                },
                timestamp: new Date()
            };

            webSocketManager.sendToUser(userToNotify, message);
        }
        catch(error){
            logger.error(error instanceof Error ? error.message : String(error))
        }
    }
}


export const webSocketEvents = new WebSocketEvents();

