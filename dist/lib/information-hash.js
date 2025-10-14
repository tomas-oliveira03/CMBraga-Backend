"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const crypto_1 = __importDefault(require("crypto"));
class InformationHash {
    key;
    encryptionIV;
    constructor() {
        this.key = crypto_1.default
            .createHash("sha512")
            .update(config_1.envs.ENCRYPTION_SECRET_KEY)
            .digest("hex")
            .substring(0, 32);
        this.encryptionIV = crypto_1.default
            .createHash("sha512")
            .update(config_1.envs.ENCRYPTION_SECRET_IV)
            .digest("hex")
            .substring(0, 16);
    }
    encrypt(data) {
        const cipher = crypto_1.default.createCipheriv("aes-256-cbc", this.key, this.encryptionIV);
        return Buffer.from(cipher.update(data, "utf8", "hex") + cipher.final("hex")).toString("base64"); // Encrypts data and converts to hex and base64
    }
    decrypt(data) {
        const buff = Buffer.from(data, "base64");
        const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", this.key, this.encryptionIV);
        return (decipher.update(buff.toString("utf8"), "hex", "utf8") +
            decipher.final("utf8")); // Decrypts data and converts to utf8
    }
}
const informationHash = new InformationHash();
exports.default = informationHash;
