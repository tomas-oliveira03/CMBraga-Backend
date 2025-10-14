"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHealthProfessionalSchema = exports.CreateHealthProfessionalSchema = exports.HealthProfessionalSchema = void 0;
const types_1 = require("../../helpers/types");
const zod_1 = require("zod");
exports.HealthProfessionalSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string(),
    password: zod_1.z.string(),
    specialty: zod_1.z.nativeEnum(types_1.HealthProfessionalSpecialty),
    createdAt: zod_1.z.date(),
    activatedAt: zod_1.z.date().nullable(),
    updatedAt: zod_1.z.date().nullable()
});
exports.CreateHealthProfessionalSchema = exports.HealthProfessionalSchema.omit({
    id: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true,
    password: true
});
exports.UpdateHealthProfessionalSchema = exports.HealthProfessionalSchema.omit({
    id: true,
    email: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true
}).partial();
