import express from "express";
import { initializeDatabase } from "./db";
import { envs } from "./config";
import { logger } from "./lib/logger";
import apiRouter from "./server/routers";
import { appInitialization } from "./helpers/initialize";

const app = express();

let server: ReturnType<typeof app.listen>;

const startServer = async () => {
    try {
        await appInitialization()
        // create logger middleware
        app.use((req, _, next) => {
            logger.info(`${req.method} ${req.url}`);
            next();
        });

        // Middleware to parse JSON
        app.use(express.json());
        app.use("/api", apiRouter);

        server = app.listen(envs.PORT, () => {
            logger.info(`Server is running at http://localhost:${envs.PORT}`);
        });

        /*
		  Graceful shutdown
		*/
        const signals = ["SIGINT", "SIGTERM"];
        for (const signal of signals) {
            process.on(signal, async () => {
                logger.info(`Received signal ${signal}, shutting down.`);

                try {
                    // Stop the server
                    if (server) {
                        await new Promise<void>((resolve, reject) => {
                            server.close((err) => {
                                if (err) {
                                    logger.error(
                                        "Error closing Express server:",
                                        err,
                                    );
                                    reject(err);
                                } else {
                                    logger.info("Express server closed.");
                                    resolve();
                                }
                            });
                        });
                    }

                    process.exit(0); // Exit the process cleanly
                } catch (err) {
                    logger.error("Error during shutdown:", err);
                    logger.flush();
                    process.exit(1); // Exit with failure
                }
            });
        }
    } catch (error) {
        console.log(error);
        logger.error("Error during startup:", error);
        logger.flush();
        process.exit(1);
    }
};

startServer();
