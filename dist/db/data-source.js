"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
const entitiesPaths = config_1.envs.DOCKER_BUILD
    ? "dist/db/entities/*.js"
    : "src/db/entities/*.ts";
const migrationsPaths = config_1.envs.DOCKER_BUILD
    ? "dist/db/migrations/*.js"
    : "src/db/migrations/*.ts";
const sslConfig = config_1.envs.isProd
    ? { rejectUnauthorized: false }
    : false;
const baseSettings = {
    type: "postgres",
    url: config_1.envs.DATABASE_URL,
    ssl: sslConfig,
    // logging: isDev,
    logging: false,
    entities: [entitiesPaths],
    migrations: [migrationsPaths],
    subscribers: [],
    migrationsRun: config_1.envs.isDev,
    maxQueryExecutionTime: 5 * 1000,
    poolSize: 8,
    logger: "simple-console",
    namingStrategy: new typeorm_naming_strategies_1.SnakeNamingStrategy(),
};
const AppDataSource = new typeorm_1.DataSource(baseSettings);
exports.default = AppDataSource;
