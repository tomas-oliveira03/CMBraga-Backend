"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const config_1 = require("./config");
const logger_1 = require("./lib/logger");
const routers_1 = __importDefault(require("./server/routers"));
const initialize_1 = require("./helpers/initialize");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./lib/swagger");
const websocket_1 = require("./server/services/websocket");
const auth_1 = require("./lib/auth");
const url_1 = __importDefault(require("url"));
const cron_1 = require("./cron");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
    if (isShuttingDown) {
        logger_1.logger.info(`Already shutting down, ignoring ${signal}`);
        return;
    }
    isShuttingDown = true;
    logger_1.logger.info(`Received signal ${signal}, shutting down gracefully.`);
    try {
        // Stop cron jobs first
        (0, cron_1.stopCronJobs)();
        // Close WebSocket connections
        wss.clients.forEach((socket) => {
            socket.close(1001, 'Server shutting down');
        });
        // Stop accepting new connections
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        logger_1.logger.error("Error closing server:", err);
                        reject(err);
                    }
                    else {
                        logger_1.logger.info("Server closed.");
                        resolve();
                    }
                });
            });
        }
        logger_1.logger.info("Graceful shutdown completed.");
        logger_1.logger.flush();
        process.exit(0);
    }
    catch (err) {
        logger_1.logger.error("Error during shutdown:", err);
        logger_1.logger.flush();
        process.exit(1);
    }
};
const setupWebSocketServer = () => {
    wss.on('connection', (ws, request) => {
        try {
            const { query } = url_1.default.parse(request.url, true);
            const token = query.token;
            if (!token) {
                logger_1.logger.websocket('WebSocket connection rejected: No token provided');
                ws.close(1008, 'Authentication token required');
                return;
            }
            // Verify JWT token
            const decoded = auth_1.AuthService.verifyToken(token);
            logger_1.logger.websocket(`WebSocket authentication successful for user ${decoded.userId}`);
            // Connect user through WebSocket manager
            websocket_1.webSocketManager.connectUser(decoded.userId, decoded.role, ws);
        }
        catch (error) {
            logger_1.logger.error('WebSocket authentication error:', error);
            ws.close(1008, 'Invalid authentication token');
        }
    });
    logger_1.logger.websocket('WebSocket server initialized');
};
const startServer = async () => {
    try {
        // Add visual separation from nodemon startup messages
        console.log('\n');
        logger_1.logger.info("Starting server...");
        await (0, initialize_1.appInitialization)();
        (0, cron_1.initCronJobs)();
        // Route timing middleware
        app.use((req, res, next) => {
            const startTime = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                if (req.url.startsWith('/api/') || req.url === '/') {
                    logger_1.logger.debug(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
                }
            });
            next();
        });
        // Logger middleware
        app.use((req, _, next) => {
            if (req.url.startsWith('/api/')) {
                logger_1.logger.debug(`${req.method} ${req.url}`);
            }
            next();
        });
        // Middleware to parse JSON
        app.use(express_1.default.json());
        // Swagger documentation
        app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
        app.use("/api", routers_1.default);
        // Setup WebSocket server
        setupWebSocketServer();
        server.listen(config_1.envs.PORT, () => {
            logger_1.logger.port(`Server is running at ${config_1.envs.BASE_URL}`);
            logger_1.logger.port(`WebSocket server available at ${config_1.envs.WEBSOCKET_BASE_URL}`);
            logger_1.logger.port(`Swagger documentation available at ${config_1.envs.BASE_URL}/api-docs`);
            logger_1.logger.websocket(`WebSocket manager initialized. Connected users: ${websocket_1.webSocketManager.getConnectedUsersCount()}`);
        });
        // Register shutdown handlers only once
        const signals = ["SIGINT", "SIGTERM"];
        for (const signal of signals) {
            process.once(signal, () => gracefulShutdown(signal));
        }
    }
    catch (error) {
        console.log(error);
        logger_1.logger.error("Error during startup:", error);
        logger_1.logger.flush();
        process.exit(1);
    }
};
startServer();
