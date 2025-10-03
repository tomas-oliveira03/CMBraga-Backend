import express from "express";
import { envs } from "./config";
import { logger } from "./lib/logger";
import apiRouter from "./server/routers";
import { appInitialization } from "./helpers/initialize";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './lib/swagger';

const app = express();

let server: ReturnType<typeof app.listen>;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
        logger.info(`Already shutting down, ignoring ${signal}`);
        return;
    }
    
    isShuttingDown = true;
    logger.info(`Received signal ${signal}, shutting down gracefully.`);

    try {
        // Stop accepting new connections
        if (server) {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        logger.error("Error closing Express server:", err);
                        reject(err);
                    } else {
                        logger.info("Express server closed.");
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

const startServer = async () => {
    try {
        await appInitialization();
        
        // create logger middleware
        app.use((req, _, next) => {
            logger.info(`${req.method} ${req.url}`);
            next();
        });

        // Middleware to parse JSON
        app.use(express.json());
        
        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        
        app.use("/api", apiRouter);

        server = app.listen(envs.PORT, () => {
            logger.info(`Server is running at http://localhost:${envs.PORT}`);
            logger.info(`Swagger documentation available at http://localhost:${envs.PORT}/api-docs`);
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
