"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
class RedisClient {
    client;
    async initialize() {
        this.client = new ioredis_1.default(config_1.envs.REDIS_URL);
        this.client.on('error', (error) => logger_1.logger.error('Error received from Redis.', { error }));
    }
    getClient() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }
    async keys(prefix) {
        const client = this.getClient();
        return await client.keys(prefix);
    }
    async get(key) {
        const client = this.getClient();
        return await client.get(key);
    }
    async set(key, value, expirationSeconds = 0) {
        const client = this.getClient();
        if (expirationSeconds > 0) {
            await client.setex(key, expirationSeconds, value);
            return;
        }
        await client.set(key, value);
    }
    async hSet(key, values) {
        const client = this.getClient();
        await client.hset(key, values);
    }
    async hGetAll(key) {
        const client = this.getClient();
        return await client.hgetall(key);
    }
    async del(key) {
        const client = this.getClient();
        await client.del(key);
    }
    async quit() {
        const client = this.getClient();
        await client.quit();
    }
}
const redisClient = new RedisClient();
exports.default = redisClient;
