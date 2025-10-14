"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMedicalReportSchema = exports.CreateMedicalReportSchema = exports.MedicalReportSchema = void 0;
const zod_1 = require("zod");
exports.MedicalReportSchema = zod_1.z.object({
    id: zod_1.z.string(),
    childId: zod_1.z.string(),
    healthProfessionalId: zod_1.z.string(),
    diagnosis: zod_1.z.string(),
    recommendations: zod_1.z.string().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date().nullable()
});
exports.CreateMedicalReportSchema = exports.MedicalReportSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.UpdateMedicalReportSchema = exports.MedicalReportSchema.omit({
    id: true,
    childId: true,
    healthProfessionalId: true,
    createdAt: true,
    updatedAt: true
}).partial();
