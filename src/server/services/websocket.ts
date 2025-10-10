import { WebSocket } from 'ws';
import { UserRole } from '@/helpers/types';
import { logger } from '@/lib/logger';
import { userConnectedToWebsocket, WebSocketEvent, WebSocketMessage } from './websocket-events';

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

        userConnectedToWebsocket(userId);
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
