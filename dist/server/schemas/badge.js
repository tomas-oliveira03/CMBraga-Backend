"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBadgeSchema = exports.CreateBadgeSchema = void 0;
const types_1 = require("../../helpers/types");
const zod_1 = require("zod");
exports.CreateBadgeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    criteria: zod_1.z.nativeEnum(types_1.BadgeCriteria),
    value: zod_1.z.number().min(0)
});
exports.UpdateBadgeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    criteria: zod_1.z.nativeEnum(types_1.BadgeCriteria).optional(),
    value: zod_1.z.number().min(0).optional()
});
