import { initializeDatabase } from "@/db";
import { initializeMongo } from "@/db/mongo";
import { logger } from "@/lib/logger";
import redisClient from "@/lib/redis";

export const appInitialization = async () => {
	logger.info("Initializing resources...");

	await initializeDatabase()
	await redisClient.initialize()
	await initializeMongo()

}