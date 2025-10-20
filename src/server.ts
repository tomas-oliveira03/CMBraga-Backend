import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { envs } from "./config";
import { logger } from "./lib/logger";
import apiRouter from "./server/routers";
import { appInitialization } from "./helpers/initialize";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './lib/swagger';
import { webSocketManager } from "./server/services/websocket";
import { AuthService } from "./lib/auth";
import url from "url";
import { initCronJobs, stopCronJobs } from "./cron";
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
        logger.info(`Already shutting down, ignoring ${signal}`);
        return;
    }
    
    isShuttingDown = true;
    logger.info(`Received signal ${signal}, shutting down gracefully.`);

    try {
        // Stop cron jobs first
        stopCronJobs();
        
        // Close WebSocket connections
        wss.clients.forEach((socket) => {
            socket.close(1001, 'Server shutting down');
        });

        // Stop accepting new connections
        if (server) {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        logger.error("Error closing server:", err);
                        reject(err);
                    } else {
                        logger.info("Server closed.");
                        resolve();
                    }
                });
            });
        }

        logger.info("Graceful shutdown completed.");
        logger.flush();
        process.exit(0);
    } catch (err) {
        logger.error("Error during shutdown:", err);
        logger.flush();
        process.exit(1);
    }
};

const setupWebSocketServer = () => {
    wss.on('connection', (ws, request) => {
        try {
            const { query } = url.parse(request.url!, true);
            const token = query.token as string;

            if (!token) {
                logger.websocket('WebSocket connection rejected: No token provided');
                ws.close(1008, 'Authentication token required');
                return;
            }

            // Verify JWT token
            const decoded = AuthService.verifyToken(token);
            logger.websocket(`WebSocket authentication successful for user ${decoded.userId}`);
            
            // Connect user through WebSocket manager
            webSocketManager.connectUser(decoded.email, decoded.role, ws);
            
        } catch (error) {
            logger.error('WebSocket authentication error:', error);
            ws.close(1008, 'Invalid authentication token');
        }
    });

    logger.websocket('WebSocket server initialized');
};

const startServer = async () => {
    try {
        // Add visual separation from nodemon startup messages
        console.log('\n');
        logger.info("Starting server...")
        await appInitialization();

        initCronJobs()
        webSocketManager.setAllChatRooms()
        
        // Route timing middleware
        app.use((req, res, next) => {
            const startTime = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                if (req.url.startsWith('/api/') || req.url === '/') {
                    logger.debug(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
                }
            });
            
            next();
        });

        // Logger middleware
        app.use((req, _, next) => {
            if (req.url.startsWith('/api/')) {
                logger.debug(`${req.method} ${req.url}`);
            }
            next();
        });

        // Middleware to parse JSON
        app.use(express.json());
        
        // CORS configuration
        app.use(cors());

        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        
        app.use("/api", apiRouter);

        // Setup WebSocket server
        setupWebSocketServer();

        server.listen(envs.PORT, () => {
            logger.port(`Server is running at ${envs.BASE_URL}`);
            logger.port(`WebSocket server available at ${envs.WEBSOCKET_BASE_URL}`);
            logger.port(`Swagger documentation available at ${envs.BASE_URL}/api-docs`);
            logger.websocket(`WebSocket manager initialized. Connected users: ${webSocketManager.getConnectedUsersCount()}`);
        });

        // Register shutdown handlers only once
        const signals = ["SIGINT", "SIGTERM"];
        for (const signal of signals) {
            process.once(signal, () => gracefulShutdown(signal));
        }

    } catch (error) {
        console.log(error);
        logger.error("Error during startup:", error);
        logger.flush();
        process.exit(1);
    }
};

startServer();
