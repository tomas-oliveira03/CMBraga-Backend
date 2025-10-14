"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
const config_1 = require("../config");
const data_source_1 = __importDefault(require("./data-source"));
async function initializeDatabase() {
    await data_source_1.default.initialize();
    const sqlInMemory = await data_source_1.default.driver.createSchemaBuilder().log();
    for (const query of sqlInMemory.upQueries) {
        const sqlString = `${query.query.trim()};`;
        if (config_1.envs.isLocal) {
            console.error(sqlString);
        }
        else {
            console.log("Database change not reflected in migrations", {
                migration: sqlString,
            });
        }
    }
}
exports.AppDataSource = data_source_1.default;
