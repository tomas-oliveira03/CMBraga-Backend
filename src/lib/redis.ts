import { envs } from '@/config';
import Redis from 'ioredis';
import { logger } from './logger';


class RedisClient {
	private client?: Redis;

	async initialize(): Promise<void> {
		this.client = new Redis(envs.REDIS_URL);
		this.client.on('error', (error) => logger.error('Error received from Redis.', { error }));
	}

	private getClient(): Redis {
		if (!this.client) {
			throw new Error('Redis client not initialized');
		}
		return this.client;
	}

	async keys(prefix: string) {
		const client = this.getClient();
		return await client.keys(prefix);
	}

	async get(key: string) {
		const client = this.getClient();
		return await client.get(key);
	}

	async set(key: string, value: string, expirationSeconds = 0) {
		const client = this.getClient();

		if (expirationSeconds > 0) {
			await client.setex(key, expirationSeconds, value);
			return;
		}

		await client.set(key, value);
	}

	async hSet(key: string, values: Record<string, string>): Promise<void> {
		const client = this.getClient();
		await client.hset(key, values);
	}

	async hGetAll(key: string): Promise<Record<string, string>> {
		const client = this.getClient();
		return await client.hgetall(key);
	}

	async del(key: string) {
		const client = this.getClient();
		await client.del(key);
	}

	async quit() {
		const client = this.getClient();
		await client.quit();
	}

	async flushAll() {
		const client = this.getClient();
		await client.flushall();
	}

}

const redisClient = new RedisClient();
export default redisClient;