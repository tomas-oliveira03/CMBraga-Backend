"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../lib/logger");
const utils_1 = require("../helpers/utils"); // Optional – or just use '0 * * * *' directly
class HealthCheck {
    static job = null;
    static start() {
        if (this.job) {
            logger_1.logger.cron('HealthPingCron: Job already running. Skipping duplicate schedule.');
            return;
        }
        this.job = node_cron_1.default.schedule(utils_1.CronExpression.EVERY_5_MINUTES, async () => {
            try {
                const url = 'https://cmbraga-backend.onrender.com/api/health';
                const response = await axios_1.default.get(url);
                logger_1.logger.cron(`HealthPingCron: ✅ Ping successful (${response.status})`);
            }
            catch (err) {
                logger_1.logger.cron('HealthPingCron: ❌ Ping failed', { error: err.message });
            }
        }, {
            timezone: 'Europe/Lisbon',
        });
        logger_1.logger.cron('HealthPingCron: Started');
    }
    static stop() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            logger_1.logger.cron('HealthPingCron: Stopped');
        }
    }
}
exports.default = HealthCheck;
