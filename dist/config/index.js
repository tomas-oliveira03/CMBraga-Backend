"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envs = exports.EnvName = void 0;
require("dotenv/config");
var EnvName;
(function (EnvName) {
    EnvName["DEVELOPMENT"] = "development";
    EnvName["STAGING"] = "staging";
    EnvName["PRODUCTION"] = "production";
    EnvName["LOCAL"] = "local";
    EnvName["TEST"] = "test";
})(EnvName || (exports.EnvName = EnvName = {}));
class Envs {
    static instance;
    missingKeys = [];
    DOCKER_BUILD = this.getBool("DOCKER_BUILD", false);
    HOST = this.getString("HOST", "localhost");
    PORT = this.getInt("PORT", 3001);
    DATABASE_URL = this.getString("DATABASE_URL", "postgres://cmbraga-service:cmbraga-service@localhost:5201/cmbraga-service");
    REDIS_URL = this.getString("REDIS_URL", "redis://localhost:6420");
    ENCRYPTION_SECRET_IV = this.getString("ENCRYPTION_SECRET_IV", "your_secret");
    ENCRYPTION_SECRET_KEY = this.getString("ENCRYPTION_SECRET_KEY", "your_secret");
    FRONTEND_URL = this.getString("FRONTEND_URL", "http://localhost:5173");
    NODE_ENV = this.getString("NODE_ENV", EnvName.LOCAL);
    LOGDNA_KEY = this.getString("LOGDNA_KEY", "");
    JWT_SECRET = this.getString("JWT_SECRET", "your_secret");
    LOGGER_SHOW_DATETIME = this.getBool("LOGGER_SHOW_DATETIME", false);
    OPEN_WEATHER_API_KEY = this.getString("OPEN_WEATHER_API_KEY", "your_api_key");
    GMAIL_USERNAME = this.getString("GMAIL_USERNAME", "your_secret");
    GMAIL_PASSWORD_SMTP = this.getString("GMAIL_PASSWORD_SMTP", "your_secret");
    SMTP_SERVER = this.getString("SMTP_SERVER", "smtp.gmail.com");
    SMTP_PORT = this.getInt("SMTP_PORT", 587);
    BASE_URL = this.isProd
        ? `${this.HOST}`
        : `http://${this.HOST}:${this.PORT}`;
    WEBSOCKET_BASE_URL = this.isProd
        ? `wss://${this.HOST.replace(/^https?:\/\//, '')}`
        : `ws://${this.HOST}:${this.PORT}`;
    constructor() {
        if (this.NODE_ENV === EnvName.LOCAL) {
            return;
        }
        this.missingKeys = [];
        this.validateConfig();
    }
    validateConfig() {
        if (this.missingKeys.length > 0) {
            throw new Error(`Missing environment variables: ${this.missingKeys.join(", ")}`);
        }
    }
    static getInstance() {
        if (!Envs.instance) {
            Envs.instance = new Envs();
        }
        return Envs.instance;
    }
    // Computed properties for environment checks
    get isLocal() {
        return this.NODE_ENV === EnvName.LOCAL;
    }
    get isDev() {
        return this.NODE_ENV === EnvName.DEVELOPMENT;
    }
    get isProd() {
        return this.NODE_ENV === EnvName.PRODUCTION;
    }
    checkFallback(key) {
        if (!this.isLocal) {
            const val = process.env[key];
            if (!val) {
                this.missingKeys.push(key);
            }
        }
    }
    getString(key, fallback) {
        this.checkFallback(key);
        return process.env[key] || fallback;
    }
    getInt(key, fallback) {
        this.checkFallback(key);
        const val = process.env[key];
        if (val === undefined)
            return fallback;
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? fallback : parsed;
    }
    getBool(key, fallback) {
        this.checkFallback(key);
        const val = process.env[key];
        if (val === undefined)
            return fallback;
        return val.toLowerCase() === "true";
    }
}
exports.envs = Envs.getInstance();
