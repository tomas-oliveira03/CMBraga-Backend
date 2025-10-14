"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthProfessional = void 0;
const typeorm_1 = require("typeorm");
const MedicalReport_1 = require("./MedicalReport");
const types_1 = require("../../helpers/types");
const User_1 = require("./User");
let HealthProfessional = class HealthProfessional {
    id;
    name;
    email;
    password;
    specialty;
    createdAt;
    activatedAt;
    updatedAt;
    medicalReports;
    user;
};
exports.HealthProfessional = HealthProfessional;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], HealthProfessional.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], HealthProfessional.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], HealthProfessional.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, select: false }),
    __metadata("design:type", String)
], HealthProfessional.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], HealthProfessional.prototype, "specialty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], HealthProfessional.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], HealthProfessional.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], HealthProfessional.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MedicalReport_1.MedicalReport, medicalReport => medicalReport.healthProfessional),
    __metadata("design:type", Array)
], HealthProfessional.prototype, "medicalReports", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], HealthProfessional.prototype, "user", void 0);
exports.HealthProfessional = HealthProfessional = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)(`"specialty" IN ('pediatrician', 'nutritionist', 'general_practitioner')`)
], HealthProfessional);
