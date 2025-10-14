"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
exports.stopCronJobs = stopCronJobs;
const logger_1 = require("../lib/logger");
const activityCheck_1 = __importDefault(require("./activityCheck"));
const config_1 = require("../config");
const healthCheck_1 = __importDefault(require("./healthCheck"));
function initCronJobs() {
    logger_1.logger.cron('Initializing cron jobs...');
    // Start all cron jobs
    activityCheck_1.default.start();
    if (config_1.envs.isProd) {
        healthCheck_1.default.start();
    }
}
function stopCronJobs() {
    logger_1.logger.cron('Stopping all cron jobs...');
    activityCheck_1.default.stop();
}
