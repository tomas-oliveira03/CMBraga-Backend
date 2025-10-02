import { initializeDatabase } from "@/db";
import { logger } from "@/lib/logger";
import redisClient from "@/lib/redis";

export const appInitialization = async () => {
	logger.info("Initializing resources...");

	await initializeDatabase()
	await redisClient.initialize()

}