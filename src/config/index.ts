import 'dotenv/config';

export enum EnvName {
	DEVELOPMENT = 'development',
	STAGING = 'staging',
	PRODUCTION = 'production',
	LOCAL = 'local',
	TEST = 'test',
}

class Envs {
	private static instance: Envs;
	private missingKeys: string[] = [];

	public readonly DOCKER_BUILD: boolean = this.getBool('DOCKER_BUILD', false);
	public readonly PORT: number = this.getInt('PORT', 3001);
	public readonly DATABASE_URL: string = this.getString(
		'DATABASE_URL',
		'postgres://cmbraga-service:cmbraga-service@localhost:5201/cmbraga-service'
	);
	public readonly REDIS_URL: string = this.getString(
		'REDIS_URL',
		'redis://localhost:6420'
  	);
	public readonly ENCRYPTION_SECRET_IV: string = this.getString('ENCRYPTION_SECRET_IV', 'your_secret');
	public readonly ENCRYPTION_SECRET_KEY: string = this.getString('ENCRYPTION_SECRET_KEY', 'your_secret');
	public readonly FRONTEND_URL: string = this.getString('FRONTEND_URL', 'http://localhost:5173');
	public readonly NODE_ENV: string = this.getString('NODE_ENV', EnvName.LOCAL);
	public readonly LOGDNA_KEY: string = this.getString('LOGDNA_KEY', '');

	private constructor() {
		if (this.NODE_ENV === EnvName.LOCAL) {
			return
		}
		this.missingKeys = [];
		this.validateConfig();
	}

	private validateConfig(): void {
		if (this.missingKeys.length > 0) {
			throw new Error(`Missing environment variables: ${this.missingKeys.join(', ')}`);
		}
	}

	public static getInstance(): Envs {
		if (!Envs.instance) {
			Envs.instance = new Envs();
		}
		return Envs.instance;
	}

	// Computed properties for environment checks
	public get isLocal(): boolean {
		return this.NODE_ENV === EnvName.LOCAL;
	}

	public get isDev(): boolean {
		return this.NODE_ENV === EnvName.DEVELOPMENT;
	}

	public get isProd(): boolean {
		return this.NODE_ENV === EnvName.PRODUCTION;
	}

	private checkFallback(key: string) {
		if (!this.isLocal) {
			const val = process.env[key];
			if (!val) {
				this.missingKeys.push(key)
			}
		}
	}
	private getString(key: string, fallback: string): string {
		this.checkFallback(key)
		return process.env[key] || fallback
	}

	private getInt(key: string, fallback: number): number {
		this.checkFallback(key)
		const val = process.env[key];
		if (val === undefined) return fallback;
		const parsed = parseInt(val, 10);
		return isNaN(parsed) ? fallback : parsed;
	}

	private getBool(key: string, fallback: boolean): boolean {
		this.checkFallback(key)
		const val = process.env[key];
		if (val === undefined) return fallback;

		return val.toLowerCase() === "true";
	}

}

export const envs = Envs.getInstance();