"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateActivitySessionSchema = exports.CreateActivitySessionSchema = exports.ActivitySessionSchema = exports.ActivityModeEnum = exports.ActivityTypeEnum = void 0;
const zod_1 = require("zod");
const types_1 = require("../../helpers/types");
exports.ActivityTypeEnum = zod_1.z.enum([types_1.ActivityType.PEDIBUS, types_1.ActivityType.CICLO_EXPRESSO]);
exports.ActivityModeEnum = zod_1.z.enum([types_1.ActivityMode.WALK, types_1.ActivityMode.BIKE]);
exports.ActivitySessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: exports.ActivityTypeEnum,
    mode: exports.ActivityModeEnum,
    inLateRegistration: zod_1.z.boolean(),
    scheduledAt: zod_1.z.coerce.date(),
    startedAt: zod_1.z.coerce.date(),
    finishedAt: zod_1.z.coerce.date().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date().nullable(),
    startedById: zod_1.z.string().nullable(),
    finishedById: zod_1.z.string().nullable()
});
exports.CreateActivitySessionSchema = exports.ActivitySessionSchema.omit({
    id: true,
    inLateRegistration: true,
    startedAt: true,
    finishedAt: true,
    createdAt: true,
    updatedAt: true,
    startedById: true,
    mode: true,
    finishedById: true
});
exports.UpdateActivitySessionSchema = exports.ActivitySessionSchema.omit({
    id: true,
    inLateRegistration: true,
    mode: true,
    createdAt: true,
    updatedAt: true,
    startedById: true,
    finishedById: true
}).partial();
