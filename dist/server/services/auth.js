"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const db_1 = require("../../db");
const Admin_1 = require("../../db/entities/Admin");
const Instructor_1 = require("../../db/entities/Instructor");
const Parent_1 = require("../../db/entities/Parent");
const HealthProfessional_1 = require("../../db/entities/HealthProfessional");
const information_hash_1 = __importDefault(require("../../lib/information-hash"));
const auth_1 = require("../../lib/auth");
const types_1 = require("../../helpers/types");
class AuthenticationService {
    static async login(credentials) {
        const { email, password } = credentials;
        // Try to find user in all user tables
        const admin = await db_1.AppDataSource.getRepository(Admin_1.Admin).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true
            }
        });
        if (admin && this.verifyPassword(password, admin.password)) {
            return this.createAuthResponse(admin, types_1.UserRole.ADMIN);
        }
        const instructor = await db_1.AppDataSource.getRepository(Instructor_1.Instructor).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true
            }
        });
        if (instructor && this.verifyPassword(password, instructor.password)) {
            return this.createAuthResponse(instructor, types_1.UserRole.INSTRUCTOR);
        }
        const parent = await db_1.AppDataSource.getRepository(Parent_1.Parent).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true
            }
        });
        if (parent && this.verifyPassword(password, parent.password)) {
            return this.createAuthResponse(parent, types_1.UserRole.PARENT);
        }
        const healthProfessional = await db_1.AppDataSource.getRepository(HealthProfessional_1.HealthProfessional).findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true
            }
        });
        if (healthProfessional && this.verifyPassword(password, healthProfessional.password)) {
            return this.createAuthResponse(healthProfessional, types_1.UserRole.HEALTH_PROFESSIONAL);
        }
        throw new Error('Invalid email or password');
    }
    static verifyPassword(plainPassword, hashedPassword) {
        try {
            const decrypted = information_hash_1.default.decrypt(hashedPassword);
            return decrypted === plainPassword;
        }
        catch {
            return false;
        }
    }
    static createAuthResponse(user, role) {
        const token = auth_1.AuthService.generateToken({
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
                role
            }
        };
    }
}
exports.AuthenticationService = AuthenticationService;
