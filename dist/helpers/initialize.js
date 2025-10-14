"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appInitialization = void 0;
const db_1 = require("../db");
const logger_1 = require("../lib/logger");
const appInitialization = async () => {
    logger_1.logger.database("Initializing database resources...");
    await (0, db_1.initializeDatabase)();
    logger_1.logger.database("All database resources have been initialized.");
};
exports.appInitialization = appInitialization;
