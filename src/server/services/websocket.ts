import { WebSocket } from 'ws';
import { AppDataSource } from '@/db';
import { Admin } from '@/db/entities/Admin';
import { Instructor } from '@/db/entities/Instructor';
import { Parent } from '@/db/entities/Parent';
import { HealthProfessional } from '@/db/entities/HealthProfessional';
import { getMongoDB } from '@/db/mongo';
import { logger } from '@/lib/logger';
import { NotificationType, UserRole } from '@/helpers/types';

export interface UserConnection {
    userId: string;
    role: UserRole;
    socket: WebSocket;
    rooms: Set<string>;
}

export interface RoomMember {
    userId: string;
    name: string;
    role: UserRole;
}

export interface NotificationMessage {
    type: NotificationType;
    conversationId?: string;
    title: string;
    content: string;
    from: RoomMember;
    timestamp: string;
}

class WebSocketManager {
    private connections: Map<string, UserConnection> = new Map();
    private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds

    // Connect user and load their rooms
    async connectUser(userId: string, role: UserRole, socket: WebSocket): Promise<void> {
        try {
            // Get user details
            const user = await this.getUserDetails(userId, role);
            if (!user) {
                socket.close(1008, 'User not found');
                return;
            }

            // Close existing connection if any
            if (this.connections.has(userId)) {
                const existingConnection = this.connections.get(userId);
                existingConnection?.socket.close(1000, 'New connection established');
            }

            const userRooms = await this.loadUserRooms(userId);
            
            const connection: UserConnection = {
                userId,
                role,
                socket,
                rooms: new Set(userRooms)
            };

            this.connections.set(userId, connection);

            // Add user to room mappings
            userRooms.forEach(roomId => {
                if (!this.rooms.has(roomId)) {
                    this.rooms.set(roomId, new Set());
                }
                this.rooms.get(roomId)!.add(userId);
            });

            // Setup socket event handlers
            this.setupSocketHandlers(connection);

            logger.websocket(`User ${userId} connected with ${userRooms.length} rooms`, { userId, role, roomCount: userRooms.length });
        } catch (error) {
            logger.error(`Error connecting user ${userId}:`, error);
            socket.close(1011, 'Internal server error');
        }
    }

    // Disconnect user
    disconnectUser(userId: string): void {
        const connection = this.connections.get(userId);
        if (!connection) return;

        // Remove user from all rooms
        connection.rooms.forEach(roomId => {
            const roomMembers = this.rooms.get(roomId);
            if (roomMembers) {
                roomMembers.delete(userId);
                if (roomMembers.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        });

        // Close socket and remove connection
        if (connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.close(1000, 'User disconnected');
        }
        this.connections.delete(userId);

        logger.websocket(`User ${userId} disconnected`, { userId });
    }

    // Send notification to specific users in a room
    async sendNotificationToRoom(roomId: string, notification: NotificationMessage, excludeUserId?: string): Promise<void> {
        const roomMembers = this.rooms.get(roomId);
        if (!roomMembers) return;

        const message = JSON.stringify({
            type: 'notification',
            data: notification
        });

        roomMembers.forEach(userId => {
            if (excludeUserId && userId === excludeUserId) return;
            
            const connection = this.connections.get(userId);
            if (connection && connection.socket.readyState === WebSocket.OPEN) {
                connection.socket.send(message);
            }
        });

        logger.websocket(`Sent notification to room ${roomId} (${roomMembers.size} members)`, { roomId, memberCount: roomMembers.size, notificationType: notification.type });
    }

    // Send notification to specific user
    async sendNotificationToUser(userId: string, notification: NotificationMessage): Promise<void> {
        const connection = this.connections.get(userId);
        if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
            logger.warn(`Cannot send notification to user ${userId}: not connected`);
            return;
        }

        const message = JSON.stringify({
            type: 'notification',
            data: notification
        });

        connection.socket.send(message);
        logger.websocket(`Sent notification to user ${userId}`, { userId, notificationType: notification.type });
    }

    // Load all rooms and connections when server starts
    async initializeRoomsAndConnections(): Promise<void> {
        try {
            logger.websocket('Initializing WebSocket rooms from database...');

            // Load all communications from MongoDB
            const db = getMongoDB();
            const communications = await db.collection('communications').find({}).toArray();

            // Initialize room mappings (without active connections)
            for (const comm of communications) {
                const roomId = comm.conversation_id;
                const memberIds = comm.members.map((m: any) => m.id);
                
                if (!this.rooms.has(roomId)) {
                    this.rooms.set(roomId, new Set());
                }
                
                logger.debug(`Initialized room ${roomId} with ${memberIds.length} potential members`);
            }

            logger.websocket('WebSocket room initialization completed');
        } catch (error) {
            logger.error('Error initializing WebSocket rooms:', error);
        }
    }

    // Get connected users count
    getConnectedUsersCount(): number {
        return this.connections.size;
    }

    // Get rooms count
    getRoomsCount(): number {
        return this.rooms.size;
    }

    private async getUserDetails(userId: string, role: UserRole) {
        switch (role) {
            case UserRole.ADMIN:
                return await AppDataSource.getRepository(Admin).findOne({ where: { id: userId } });
            case UserRole.INSTRUCTOR:
                return await AppDataSource.getRepository(Instructor).findOne({ where: { id: userId } });
            case UserRole.PARENT:
                return await AppDataSource.getRepository(Parent).findOne({ where: { id: userId } });
            case UserRole.HEALTH_PROFESSIONAL:
                return await AppDataSource.getRepository(HealthProfessional).findOne({ where: { id: userId } });
            default:
                return null;
        }
    }

    private async loadUserRooms(userId: string): Promise<string[]> {
        try {
            const db = getMongoDB();
            
            // Find all communications where user is a member
            const communications = await db.collection('communications').find({
                'members.id': userId
            }).toArray();

            return communications.map(comm => comm.conversation_id);
        } catch (error) {
            logger.error(`Error loading rooms for user ${userId}:`, error);
            return [];
        }
    }

    private setupSocketHandlers(connection: UserConnection): void {
        const { userId, socket } = connection;

        socket.on('close', (code, reason) => {
            logger.websocket(`WebSocket closed for user ${userId}: ${code} - ${reason}`, { userId, code, reason });
            this.disconnectUser(userId);
        });

        socket.on('error', (error) => {
            logger.error(`WebSocket error for user ${userId}:`, { userId, error });
            this.disconnectUser(userId);
        });

        socket.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleSocketMessage(userId, message);
            } catch (error) {
                logger.error(`Error parsing message from user ${userId}:`, { userId, error });
            }
        });

        // Send initial connection success message
        socket.send(JSON.stringify({
            type: 'connected',
            data: {
                message: 'WebSocket connected successfully',
                rooms: Array.from(connection.rooms)
            }
        }));
    }

    private handleSocketMessage(userId: string, message: any): void {
        switch (message.type) {
            case 'ping':
                const connection = this.connections.get(userId);
                if (connection && connection.socket.readyState === WebSocket.OPEN) {
                    connection.socket.send(JSON.stringify({ type: 'pong' }));
                }
                break;
            case 'join_room':
                // Handle joining new rooms (for dynamic room joining)
                break;
            default:
                logger.warn(`Unknown message type from user ${userId}: ${message.type}`, { userId, messageType: message.type });
        }
    }
}

export const webSocketManager = new WebSocketManager();
