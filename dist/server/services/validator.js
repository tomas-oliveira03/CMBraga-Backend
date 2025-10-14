"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfEmailExists = checkIfEmailExists;
const db_1 = require("../../db");
const Admin_1 = require("../../db/entities/Admin");
const HealthProfessional_1 = require("../../db/entities/HealthProfessional");
const Instructor_1 = require("../../db/entities/Instructor");
const Parent_1 = require("../../db/entities/Parent");
async function checkIfEmailExists(email) {
    const parent = await db_1.AppDataSource.getRepository(Parent_1.Parent).findOne({ where: { email: email } });
    if (parent) {
        return true;
    }
    const instructor = await db_1.AppDataSource.getRepository(Instructor_1.Instructor).findOne({ where: { email: email } });
    if (instructor) {
        return true;
    }
    const admin = await db_1.AppDataSource.getRepository(Admin_1.Admin).findOne({ where: { email: email } });
    if (admin) {
        return true;
    }
    const healthProfessional = await db_1.AppDataSource.getRepository(HealthProfessional_1.HealthProfessional).findOne({ where: { email: email } });
    if (healthProfessional) {
        return true;
    }
    return false;
}
