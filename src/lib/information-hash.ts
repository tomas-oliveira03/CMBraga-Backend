import { envs } from "@/config";
import crypto from "crypto";

class SecureInformationHash {
    private secret: string;

    constructor() {
        const secret = envs.ENCRYPTION_SECRET_KEY;
        if (secret.length < 16) {
            throw new Error("Secret must be at least 16 characters long");
        }
        this.secret = secret;
    }

    encrypt(data: string) {
        // Generate a random 16-byte salt for key derivation
        const salt = crypto.randomBytes(16);

        // Derive a 32-byte key using scrypt (strong KDF)
        const key = crypto.scryptSync(this.secret, salt, 32);

        // Generate a random 12-byte IV for AES-GCM
        const iv = crypto.randomBytes(12);

        // Encrypt data
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
        const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);

        // Get authentication tag
        const tag = cipher.getAuthTag();

        // Return concatenated salt + iv + tag + ciphertext as base64
        return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
    }

    decrypt(data: string) {
        const buff = Buffer.from(data, "base64");

        // Extract components
        const salt = buff.slice(0, 16);
        const iv = buff.slice(16, 28);
        const tag = buff.slice(28, 44);
        const encrypted = buff.slice(44);

        // Derive the key again using the same secret and salt
        const key = crypto.scryptSync(this.secret, salt, 32);

        // Decrypt
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(tag);

        return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
    }
}

export default new SecureInformationHash();
