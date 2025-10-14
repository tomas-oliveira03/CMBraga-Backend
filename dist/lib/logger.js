"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const logger_1 = require("@logdna/logger");
const config_1 = require("../config");
const chalk_1 = __importDefault(require("chalk"));
class LoggerClient {
    logger;
    constructor() {
        const appName = "cmbraga-trading-server";
        if (config_1.envs.LOGDNA_KEY) {
            this.logger = (0, logger_1.createLogger)(config_1.envs.LOGDNA_KEY, {
                app: appName,
                env: config_1.envs.NODE_ENV,
                indexMeta: false,
            });
            this.logger.on("error", (err) => {
                console.log(`[LOGGER ERROR]: ${err}`);
            });
        }
    }
    formatMessage(level, message, metadata = {}) {
        const timestamp = config_1.envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        const metaStr = Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : '';
        switch (level.toLowerCase()) {
            case 'debug':
                return chalk_1.default.white(`${timestamp}[DEBUG] ${message}${metaStr}`);
            case 'info':
                return chalk_1.default.white(`${timestamp}[INFO] ${message}${metaStr}`);
            case 'warn':
                return chalk_1.default.yellow(`${timestamp}[WARN] ${message}${metaStr}`);
            case 'error':
                return chalk_1.default.red(`${timestamp}[ERROR] ${message}${metaStr}`);
            default:
                return `${timestamp}[${level.toUpperCase()}] ${message}${metaStr}`;
        }
    }
    debug(message, metadata = {}) {
        console.log(this.formatMessage('debug', message, metadata));
        this.logger?.debug?.(message, { meta: metadata });
    }
    error(message, metadata = {}) {
        console.log(this.formatMessage('error', message, metadata));
        this.logger?.error?.(message, { meta: metadata });
    }
    info(message, metadata = {}) {
        console.log(this.formatMessage('info', message, metadata));
        this.logger?.info?.(message, { meta: metadata });
    }
    warn(message, metadata = {}) {
        console.log(this.formatMessage('warn', message, metadata));
        this.logger?.warn?.(message, { meta: metadata });
    }
    success(message, metadata = {}) {
        const timestamp = config_1.envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk_1.default.green(`${timestamp}[SUCCESS] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'success' } });
    }
    websocket(message, metadata = {}) {
        const timestamp = config_1.envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk_1.default.magenta(`${timestamp}[WS] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'websocket' } });
    }
    database(message, metadata = {}) {
        const timestamp = config_1.envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk_1.default.cyan(`${timestamp}[DB] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'database' } });
    }
    port(message, metadata = {}) {
        const timestamp = config_1.envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk_1.default.hex('#FFA500')(`${timestamp}[PORT] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'port' } });
    }
    cron(message, metadata = {}) {
        const timestamp = config_1.envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk_1.default.hex('#9966FF')(`${timestamp}[CRON] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'cron' } });
    }
    flush() {
        this.logger?.flush();
    }
}
exports.logger = new LoggerClient();
