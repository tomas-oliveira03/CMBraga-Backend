"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const utils_1 = require("../helpers/utils");
const logger_1 = require("../lib/logger");
const db_1 = require("../db");
const ActivitySession_1 = require("../db/entities/ActivitySession");
const typeorm_1 = require("typeorm");
class ActivityCheckCron {
    static job = null;
    static start() {
        if (this.job) {
            logger_1.logger.cron('ActivityCheckCron: Job already running. Skipping duplicate schedule.');
            return;
        }
        this.job = node_cron_1.default.schedule(utils_1.CronExpression.EVERY_HOUR, async () => {
            try {
                logger_1.logger.cron('ActivityCheckCron: Starting activity check job execution');
                const now = new Date();
                const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                const result = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).update({
                    scheduledAt: (0, typeorm_1.LessThan)(twelveHoursFromNow),
                    inLateRegistration: false,
                }, {
                    inLateRegistration: true
                });
                logger_1.logger.cron(`ActivityCheckCron: Completed - ${result.affected || 0} activities marked as closed`);
            }
            catch (err) {
                logger_1.logger.cron('ActivityCheckCron: Error executing activity check job', { error: err });
            }
        }, {
            timezone: 'Europe/Lisbon',
        });
    }
    static stop() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            logger_1.logger.cron('ActivityCheckCron: Cron job stopped');
        }
    }
}
exports.default = ActivityCheckCron;
