import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import { Instructor } from "@/db/entities/Instructor";
import { Parent } from "@/db/entities/Parent";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import informationHash from "@/lib/information-hash";
import { AuthService } from "@/lib/auth";
import { UserRole } from "@/helpers/types";
import { User } from "@/db/entities/User";

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
        
        const user = await AppDataSource.getRepository(User)
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.admin", "admin")
            .leftJoinAndSelect("user.instructor", "instructor")
            .leftJoinAndSelect("user.parent", "parent")
            .leftJoinAndSelect("user.healthProfessional", "hp")
            .where("user.id = :id", { id: email })
            .addSelect("admin.password")
            .addSelect("instructor.password")
            .addSelect("parent.password")
            .addSelect("hp.password")
            .getOne();

        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (user.admin && user.admin.activatedAt && this.verifyPassword(password, user.admin.password)) {
            return this.createAuthResponse(user.admin, UserRole.ADMIN);
        }

        if (user.instructor && user.instructor.activatedAt && this.verifyPassword(password, user.instructor.password)) {
            return this.createAuthResponse(user.instructor, UserRole.INSTRUCTOR);
        }

        if (user.parent && user.parent.activatedAt && this.verifyPassword(password, user.parent.password)) {
            return this.createAuthResponse(user.parent, UserRole.PARENT);
        }

        if (user.healthProfessional && user.healthProfessional.activatedAt && this.verifyPassword(password, user.healthProfessional.password)) {
            return this.createAuthResponse(user.healthProfessional, UserRole.HEALTH_PROFESSIONAL);
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
