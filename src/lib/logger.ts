import { createLogger, Logger } from "@logdna/logger";
import { envs } from "@/config";
import chalk from "chalk";

class LoggerClient {
    private logger?: Logger;

    constructor() {
        const appName = "cmbraga-trading-server";

        if (envs.LOGDNA_KEY) {
            this.logger = createLogger(envs.LOGDNA_KEY, {
                app: appName,
                env: envs.NODE_ENV,
                indexMeta: false,
            });

            this.logger.on("error", (err) => {
                console.log(`[LOGGER ERROR]: ${err}`);
            });
        }
    }

    private formatMessage(level: string, message: string, metadata = {}): string {
        const timestamp = envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        const metaStr = Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : '';
        
        switch (level.toLowerCase()) {
            case 'debug':
                return chalk.white(`${timestamp}[DEBUG] ${message}${metaStr}`);
            case 'info':
                return chalk.white(`${timestamp}[INFO] ${message}${metaStr}`);
            case 'warn':
                return chalk.yellow(`${timestamp}[WARN] ${message}${metaStr}`);
            case 'error':
                return chalk.red(`${timestamp}[ERROR] ${message}${metaStr}`);
            default:
                return `${timestamp}[${level.toUpperCase()}] ${message}${metaStr}`;
        }
    }

    public debug(message: string, metadata = {}): void {
        console.log(this.formatMessage('debug', message, metadata));
        this.logger?.debug?.(message, { meta: metadata });
    }

    public error(message: string, metadata = {}): void {
        console.log(this.formatMessage('error', message, metadata));
        this.logger?.error?.(message, { meta: metadata });
    }

    public info(message: string, metadata = {}): void {
        console.log(this.formatMessage('info', message, metadata));
        this.logger?.info?.(message, { meta: metadata });
    }

    public warn(message: string, metadata = {}): void {
        console.log(this.formatMessage('warn', message, metadata));
        this.logger?.warn?.(message, { meta: metadata });
    }

    public success(message: string, metadata = {}): void {
        const timestamp = envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk.green(`${timestamp}[SUCCESS] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'success' } });
    }

    public websocket(message: string, metadata = {}): void {
        const timestamp = envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk.magenta(`${timestamp}[WS] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'websocket' } });
    }

    public database(message: string, metadata = {}): void {
        const timestamp = envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk.cyan(`${timestamp}[DB] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'database' } });
    }

    public port(message: string, metadata = {}): void {
        const timestamp = envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk.hex('#FFA500')(`${timestamp}[PORT] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'port' } });
    }

    public cron(message: string, metadata = {}): void {
        const timestamp = envs.LOGGER_SHOW_DATETIME ? `[${new Date().toISOString()}] ` : '';
        console.log(chalk.hex('#9966FF')(`${timestamp}[CRON] ${message}${Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : ''}`));
        this.logger?.info?.(message, { meta: { ...metadata, level: 'cron' } });
    }

    public flush(): void {
        this.logger?.flush();
    }
}

export const logger = new LoggerClient();
