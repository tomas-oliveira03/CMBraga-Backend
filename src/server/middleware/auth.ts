import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '@/lib/auth';
import { UserRole } from '@/helpers/types';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = AuthService.extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = AuthService.verifyToken(token);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        return next();
    };
};

