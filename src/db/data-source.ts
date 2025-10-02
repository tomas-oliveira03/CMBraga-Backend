import { envs } from "@/config";
import "reflect-metadata"
import { DataSource, DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const entitiesPaths = envs.DOCKER_BUILD ? 'dist/db/entities/*.js' : 'src/db/entities/*.ts';
const migrationsPaths = envs.DOCKER_BUILD ? 'dist/db/migrations/*.js' : 'src/db/migrations/*.ts';

const baseSettings: DataSourceOptions = {
	type: 'postgres',
	url: envs.DATABASE_URL,
	ssl: false,
	// logging: isDev,
	logging: false,
	entities: [entitiesPaths],
	migrations: [migrationsPaths],
	subscribers: [],
	migrationsRun: envs.isDev,
	maxQueryExecutionTime: 5 * 1000,
	poolSize: 8,
	logger: 'simple-console',
	namingStrategy: new SnakeNamingStrategy(),
};

const AppDataSource = new DataSource(baseSettings);
export default AppDataSource;