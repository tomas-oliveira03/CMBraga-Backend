"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAdminSchema = exports.CreateAdminSchema = exports.AdminSchema = void 0;
const zod_1 = require("zod");
exports.AdminSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string(),
    password: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    activatedAt: zod_1.z.date().nullable(),
    updatedAt: zod_1.z.date().nullable()
});
exports.CreateAdminSchema = exports.AdminSchema.omit({
    id: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true,
    password: true
});
exports.UpdateAdminSchema = exports.AdminSchema.omit({
    id: true,
    email: true,
    createdAt: true,
    activatedAt: true,
    updatedAt: true
}).partial();
