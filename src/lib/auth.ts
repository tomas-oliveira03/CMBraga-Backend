import jwt from 'jsonwebtoken';
import { envs } from '@/config';
import { UserRole } from '@/helpers/types';

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    issuedAt?: number;
    expirationTime?: number;
}

export class AuthService {

    static generateToken(payload: Omit<JWTPayload, 'issuedAt' | 'expirationTime'>): string {
        return jwt.sign(payload, envs.JWT_SECRET, { 
            expiresIn: "7d"
        });
    }

    static verifyToken(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, envs.JWT_SECRET) as any;
            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                issuedAt: decoded.iat,
                expirationTime: decoded.exp
            };
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    static extractTokenFromHeader(authHeader?: string): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
