"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterSchema = exports.LoginSchema = void 0;
const types_1 = require("../../helpers/types");
const zod_1 = __importDefault(require("zod"));
const admin_1 = require("./admin");
const parent_1 = require("./parent");
const instructor_1 = require("./instructor");
const healthProfessional_1 = require("./healthProfessional");
exports.LoginSchema = zod_1.default.object({
    email: zod_1.default.string(),
    password: zod_1.default.string()
});
exports.RegisterSchema = zod_1.default.discriminatedUnion("type", [
    zod_1.default.object({
        type: zod_1.default.literal(types_1.UserRole.ADMIN)
    }).merge(admin_1.CreateAdminSchema),
    zod_1.default.object({
        type: zod_1.default.literal(types_1.UserRole.PARENT)
    }).merge(parent_1.CreateParentSchema),
    zod_1.default.object({
        type: zod_1.default.literal(types_1.UserRole.INSTRUCTOR)
    }).merge(instructor_1.CreateInstructorSchema),
    zod_1.default.object({
        type: zod_1.default.literal(types_1.UserRole.HEALTH_PROFESSIONAL)
    }).merge(healthProfessional_1.CreateHealthProfessionalSchema)
]);
