"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSocketManager = void 0;
const ws_1 = require("ws");
const logger_1 = require("../../lib/logger");
const websocket_events_1 = require("./websocket-events");
class WebSocketManager {
    connections = new Map();
    // Connect user - ensures only one connection per user
    connectUser(userId, role, ws) {
        // Close existing connection if any
        if (this.connections.has(userId)) {
            const existingWs = this.connections.get(userId);
            if (existingWs && existingWs.readyState === ws_1.WebSocket.OPEN) {
                existingWs.close(1000, 'New connection established');
                logger_1.logger.websocket(`Closed existing connection for user ${userId}`);
            }
        }
        // Store new connection
        this.connections.set(userId, ws);
        logger_1.logger.websocket(`User ${userId} (${role}) connected. Total connections: ${this.connections.size}`);
        // Handle disconnection
        ws.on('close', () => {
            this.connections.delete(userId);
            logger_1.logger.websocket(`User ${userId} disconnected. Total connections: ${this.connections.size}`);
        });
        // Handle errors
        ws.on('error', (error) => {
            logger_1.logger.error(`WebSocket error for user ${userId}:`, error);
            this.connections.delete(userId);
        });
        (0, websocket_events_1.userConnectedToWebsocket)(userId);
    }
    // Send message to specific user
    sendToUser(userId, message) {
        const ws = this.connections.get(userId);
        if (!ws || ws.readyState !== ws_1.WebSocket.OPEN) {
            logger_1.logger.websocket(`Cannot send to user ${userId}: Connection not open`);
            return false;
        }
        try {
            ws.send(JSON.stringify(message));
            logger_1.logger.websocket(`Sent ${message.event} to user ${userId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error sending message to user ${userId}:`, error);
            return false;
        }
    }
    // Send message to multiple users
    sendToUsers(userIds, message) {
        userIds.forEach(userId => {
            this.sendToUser(userId, message);
        });
    }
    // Broadcast to all connected users
    broadcast(message, excludeUserId) {
        this.connections.forEach((ws, userId) => {
            if (userId !== excludeUserId) {
                this.sendToUser(userId, message);
            }
        });
    }
    // Check if user is connected
    isUserConnected(userId) {
        const ws = this.connections.get(userId);
        return ws !== undefined && ws.readyState === ws_1.WebSocket.OPEN;
    }
    // Get connected users count
    getConnectedUsersCount() {
        return this.connections.size;
    }
    // Get all connected user IDs
    getConnectedUserIds() {
        return Array.from(this.connections.keys());
    }
    // Disconnect user
    disconnectUser(userId) {
        const ws = this.connections.get(userId);
        if (ws) {
            ws.close(1000, 'Disconnected by server');
            this.connections.delete(userId);
            logger_1.logger.websocket(`User ${userId} disconnected by server`);
        }
    }
}
exports.webSocketManager = new WebSocketManager();
