"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateIssueSchema = exports.CreateIssueSchema = exports.IssueSchema = void 0;
const zod_1 = require("zod");
exports.IssueSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    images: zod_1.z.array(zod_1.z.string()),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date().nullable(),
    instructorId: zod_1.z.string(),
    activitySessionId: zod_1.z.string(),
    resolvedAt: zod_1.z.coerce.date().nullable()
});
exports.CreateIssueSchema = exports.IssueSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    resolvedAt: true
});
exports.UpdateIssueSchema = exports.IssueSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    instructorId: true,
    activitySessionId: true
}).partial();
