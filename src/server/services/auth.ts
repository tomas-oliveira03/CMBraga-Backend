import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import { Instructor } from "@/db/entities/Instructor";
import { Parent } from "@/db/entities/Parent";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import informationHash from "@/lib/information-hash";
import { AuthService } from "@/lib/auth";
import { UserRole } from "@/helpers/types";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        profilePictureURL: string;
        role: UserRole;
    };
}

export class AuthenticationService {
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const { email, password } = credentials;
        
        // Try to find user in all user tables
        const admin = await AppDataSource.getRepository(Admin).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                profilePictureURL: true,
                password: true,
                activatedAt: true
            }
        });
        
        if (admin && admin.activatedAt && this.verifyPassword(password, admin.password)) {
            return this.createAuthResponse(admin, UserRole.ADMIN);
        }

        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                profilePictureURL: true,
                password: true,
                activatedAt: true
            }
        });

        if (instructor && instructor.activatedAt && this.verifyPassword(password, instructor.password)) {
            return this.createAuthResponse(instructor, UserRole.INSTRUCTOR);
        }

        const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                profilePictureURL: true,
                password: true,
                activatedAt: true
            }
        });

        if (parent && parent.activatedAt && this.verifyPassword(password, parent.password)) {
            return this.createAuthResponse(parent, UserRole.PARENT);
        }

        const healthProfessional = await AppDataSource.getRepository(HealthProfessional).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                profilePictureURL: true,
                password: true,
                activatedAt: true
            }
        });

        if (healthProfessional && healthProfessional.activatedAt && this.verifyPassword(password, healthProfessional.password)) {
            return this.createAuthResponse(healthProfessional, UserRole.HEALTH_PROFESSIONAL);
        }

        throw new Error('Invalid email or password');
    }

    private static verifyPassword(plainPassword: string, hashedPassword: string): boolean {
        try {
            const decrypted = informationHash.decrypt(hashedPassword);
            return decrypted === plainPassword;
        } catch {
            return false;
        }
    }

    private static createAuthResponse(
        user: { id: string; name: string; email: string, profilePictureURL: string }, 
        role: UserRole
    ): LoginResponse {
        const token = AuthService.generateToken({
            userId: user.id,
            email: user.email,
            role
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePictureURL: user.profilePictureURL,
                role
            }
        };
    }
}
