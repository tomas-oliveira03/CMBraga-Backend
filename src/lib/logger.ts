import { createLogger, Logger } from "@logdna/logger";
import { envs } from "@/config";
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

    public debug(message: string, metadata = {}): void {
        console.log(`[DEBUG] ${message} - ${JSON.stringify(metadata)}`);

        this.logger?.debug?.(message, { meta: metadata });
    }

    public error(message: string, metadata = {}): void {
        console.log(`[ERROR] ${message} - ${JSON.stringify(metadata)}`);
        this.logger?.error?.(message, { meta: metadata });
    }

    public info(message: string, metadata = {}): void {
        console.log(`[INFO] ${message} - ${JSON.stringify(metadata)}`);

        this.logger?.info?.(message, { meta: metadata });
    }

    public warn(message: string, metadata = {}): void {
        console.log(`[WARN] ${message} - ${JSON.stringify(metadata)}`);

        this.logger?.warn?.(message, { meta: metadata });
    }

    public flush(): void {
        this.logger?.flush();
    }
}

export const logger = new LoggerClient();
