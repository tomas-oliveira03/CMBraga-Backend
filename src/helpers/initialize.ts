import { initializeDatabase } from "@/db";
import { logger } from "@/lib/logger";
import redisClient from "@/lib/redis";

export const appInitialization = async () => {
	logger.database("Initializing database resources...");

	await initializeDatabase()
	await redisClient.initialize();
	
	logger.database("All database resources have been initialized.");

}