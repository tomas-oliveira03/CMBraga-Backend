"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../../db");
const express_1 = __importDefault(require("express"));
const ActivitySession_1 = require("../../../db/entities/ActivitySession");
const types_1 = require("../../../helpers/types");
const Parent_1 = require("../../../db/entities/Parent");
const ParentActivitySession_1 = require("../../../db/entities/ParentActivitySession");
const auth_1 = require("../../../server/middleware/auth");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    const activityId = req.query.id;
    if (!activityId || typeof activityId !== 'string') {
        return res.status(400).json({ message: "Activity ID is required" });
    }
    const activityInfo = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            parentActivitySessions: {
                parent: true
            }
        },
        select: {
            parentActivitySessions: {
                assignedAt: true,
                parent: {
                    id: true,
                    name: true
                }
            }
        }
    });
    if (!activityInfo) {
        return res.status(404).json({ message: "Activity not found" });
    }
    return res.status(200).json(activityInfo?.parentActivitySessions);
});
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    try {
        const activitySessionId = req.query.activitySessionId;
        const parentId = req.query.parentId;
        if (!activitySessionId || !parentId || typeof activitySessionId !== 'string' || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID and Parent ID are required" });
        }
        if (!parentId || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Parent ID is required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        const parent = await db_1.AppDataSource.getRepository(Parent_1.Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        // Assign parent to activity session
        await db_1.AppDataSource.getRepository(ParentActivitySession_1.ParentActivitySession).insert({
            parentId: parentId,
            activitySessionId: activitySessionId
        });
        return res.status(201).json({ message: "Parent assigned to activity session successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
router.delete('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), async (req, res) => {
    try {
        const activitySessionId = req.query.activitySessionId;
        const parentId = req.query.parentId;
        if (!activitySessionId || !parentId || typeof activitySessionId !== 'string' || typeof parentId !== 'string') {
            return res.status(400).json({ message: "Activity Session ID and Parent ID are required" });
        }
        const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }
        const parent = await db_1.AppDataSource.getRepository(Parent_1.Parent).findOne({
            where: { id: parentId }
        });
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        // Check if parent is assigned to this activity session
        const existingAssignment = await db_1.AppDataSource.getRepository(ParentActivitySession_1.ParentActivitySession).findOne({
            where: {
                parentId: parentId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Parent is not assigned to this activity session" });
        }
        // Remove parent from activity session
        await db_1.AppDataSource.getRepository(ParentActivitySession_1.ParentActivitySession).delete({
            parentId: parentId,
            activitySessionId: activitySessionId
        });
        // Remove parent from activity session
        await db_1.AppDataSource.getRepository(ParentActivitySession_1.ParentActivitySession).delete({
            parentId: parentId,
            activitySessionId: activitySessionId
        });
        return res.status(200).json({ message: "Parent removed from activity session successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});
exports.default = router;
