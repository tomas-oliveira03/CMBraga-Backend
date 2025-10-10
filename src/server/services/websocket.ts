import { WebSocket } from 'ws';
import { UserRole } from '@/helpers/types';
import { logger } from '@/lib/logger';

export enum WebSocketEvent {
    NEW_MESSAGE = 'newMessage',
    ACTIVITY_STATUS_CHANGED = 'activityStatusChanged',
    NEW_NOTIFICATION = 'newNotification',
    CONNECTION_STATUS = 'connectionStatus'
}

interface WebSocketMessage {
    event: WebSocketEvent;
    data: any;
    timestamp: Date;
}

class WebSocketManager {
    private connections: Map<string, WebSocket> = new Map();
    
    // Connect user - ensures only one connection per user
    connectUser(userId: string, role: UserRole, ws: WebSocket): void {
        // Close existing connection if any
        if (this.connections.has(userId)) {
            const existingWs = this.connections.get(userId);
            if (existingWs && existingWs.readyState === WebSocket.OPEN) {
                existingWs.close(1000, 'New connection established');
                logger.websocket(`Closed existing connection for user ${userId}`);
            }
        }

        // Store new connection
        this.connections.set(userId, ws);
        logger.websocket(`User ${userId} (${role}) connected. Total connections: ${this.connections.size}`);

        // Handle disconnection
        ws.on('close', () => {
            this.connections.delete(userId);
            logger.websocket(`User ${userId} disconnected. Total connections: ${this.connections.size}`);
        });

        // Handle errors
        ws.on('error', (error) => {
            logger.error(`WebSocket error for user ${userId}:`, error);
            this.connections.delete(userId);
        });

        // Send connection status message
        this.sendToUser(userId, {
            event: WebSocketEvent.CONNECTION_STATUS,
            data: {
                status: 'connected',
                message: 'WebSocket connection established successfully',
            },
            timestamp: new Date()
        });
    }

    // Send message to specific user
    sendToUser(userId: string, message: WebSocketMessage): boolean {
        const ws = this.connections.get(userId);
        
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            logger.websocket(`Cannot send to user ${userId}: Connection not open`);
            return false;
        }

        try {
            ws.send(JSON.stringify(message));
            logger.websocket(`Sent ${message.event} to user ${userId}`);
            return true;
        } catch (error) {
            logger.error(`Error sending message to user ${userId}:`, error);
            return false;
        }
    }

    // Send message to multiple users
    sendToUsers(userIds: string[], message: WebSocketMessage): void {
        userIds.forEach(userId => {
            this.sendToUser(userId, message);
        });
    }

    // Broadcast to all connected users
    broadcast(message: WebSocketMessage, excludeUserId?: string): void {
        this.connections.forEach((ws, userId) => {
            if (userId !== excludeUserId) {
                this.sendToUser(userId, message);
            }
        });
    }

    // Emit new message event
    emitNewMessage(userId: string, data: {
        conversationId: string;
        message: string;
        senderId: string;
        senderName: string;
    }): boolean {
        return this.sendToUser(userId, {
            event: WebSocketEvent.NEW_MESSAGE,
            data,
            timestamp: new Date()
        });
    }

    // Emit activity status changed event
    emitActivityStatusChanged(userIds: string[], data: {
        activitySessionId: string;
        status: 'started' | 'finished' | 'updated';
        message: string;
    }): void {
        this.sendToUsers(userIds, {
            event: WebSocketEvent.ACTIVITY_STATUS_CHANGED,
            data,
            timestamp: new Date()
        });
    }

    // Emit new notification event
    emitNewNotification(userId: string, data: {
        title: string;
        message: string;
        type?: 'info' | 'warning' | 'error' | 'success';
    }): boolean {
        return this.sendToUser(userId, {
            event: WebSocketEvent.NEW_NOTIFICATION,
            data: {
                ...data,
                type: data.type || 'info'
            },
            timestamp: new Date()
        });
    }

    // Check if user is connected
    isUserConnected(userId: string): boolean {
        const ws = this.connections.get(userId);
        return ws !== undefined && ws.readyState === WebSocket.OPEN;
    }

    // Get connected users count
    getConnectedUsersCount(): number {
        return this.connections.size;
    }

    // Get all connected user IDs
    getConnectedUserIds(): string[] {
        return Array.from(this.connections.keys());
    }

    // Disconnect user
    disconnectUser(userId: string): void {
        const ws = this.connections.get(userId);
        if (ws) {
            ws.close(1000, 'Disconnected by server');
            this.connections.delete(userId);
            logger.websocket(`User ${userId} disconnected by server`);
        }
    }
}

export const webSocketManager = new WebSocketManager();
