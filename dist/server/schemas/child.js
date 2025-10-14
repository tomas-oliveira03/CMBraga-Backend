"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChildSchema = exports.CreateChildSchema = exports.ChildSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../../helpers/types");
const HealthProblemsSchema = zod_1.z.object({
    allergies: zod_1.z.string().array().optional(),
    chronicDiseases: zod_1.z.string().array().optional(),
    surgeries: zod_1.z
        .object({
        type: zod_1.z.string(),
        year: zod_1.z.number()
    })
        .array()
        .optional()
});
exports.ChildSchema = zod_1.z.object({
    id: zod_1.z.string(),
    parentIds: zod_1.z.array(zod_1.z.string()),
    name: zod_1.z.string(),
    gender: zod_1.z.nativeEnum(types_1.ChildGender),
    school: zod_1.z.string(),
    schoolGrade: zod_1.z.number(),
    dropOffStationId: zod_1.z.string(),
    dateOfBirth: zod_1.z.date(),
    healthProblems: HealthProblemsSchema.optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date().nullable()
});
exports.CreateChildSchema = exports.ChildSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.UpdateChildSchema = exports.CreateChildSchema.partial();
