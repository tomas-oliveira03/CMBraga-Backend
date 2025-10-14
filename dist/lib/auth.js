"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
class AuthService {
    static generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.envs.JWT_SECRET, {
            expiresIn: "7d"
        });
    }
    static verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.envs.JWT_SECRET);
            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                issuedAt: decoded.iat,
                expirationTime: decoded.exp
            };
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
exports.AuthService = AuthService;
