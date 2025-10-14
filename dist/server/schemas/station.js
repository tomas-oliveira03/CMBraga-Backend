"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStationSchema = exports.CreateStationSchema = exports.StationSchema = exports.StationTypeEnum = void 0;
const zod_1 = require("zod");
const types_1 = require("../../helpers/types");
exports.StationTypeEnum = zod_1.z.enum([types_1.StationType.REGULAR, types_1.StationType.SCHOOL]);
exports.StationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    type: exports.StationTypeEnum,
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date().nullable()
});
exports.CreateStationSchema = exports.StationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.UpdateStationSchema = exports.StationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).partial();
