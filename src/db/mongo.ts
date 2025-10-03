import { MongoClient, Db } from "mongodb";
import { envs } from "@/config";
import { logger } from "@/lib/logger";

const client = new MongoClient(envs.MONGODB_URL);
let db: Db;

export async function initializeMongo(): Promise<void> {
    try {
        await client.connect();
        db = client.db();

        logger.info("Connected to MongoDB");

        const requiredCollections = ["communications"];
        const existingCollections = await db.listCollections().toArray();
        const existingCollectionNames = existingCollections.map((col) => col.name);

        for (const collection of requiredCollections) {
            if (!existingCollectionNames.includes(collection)) {
                await db.createCollection(collection);
                logger.info(`Created missing collection: ${collection}`);
            }
        }
    } catch (error) {
        logger.error("Error initializing MongoDB", { error });
        throw error;
    }
}

export function getMongoDB(): Db {
    if (!db) {
        throw new Error("MongoDB not initialized");
    }
    return db;
}
