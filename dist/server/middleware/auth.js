"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const auth_1 = require("../../lib/auth");
const authenticate = (req, res, next) => {
    try {
        const token = auth_1.AuthService.extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        const decoded = auth_1.AuthService.verifyToken(token);
        req.user = decoded;
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        return next();
    };
};
exports.authorize = authorize;
