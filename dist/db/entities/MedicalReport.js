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
exports.MedicalReport = void 0;
const typeorm_1 = require("typeorm");
const Child_1 = require("./Child");
const HealthProfessional_1 = require("./HealthProfessional");
let MedicalReport = class MedicalReport {
    id;
    childId;
    healthProfessionalId;
    diagnosis;
    recommendations;
    createdAt;
    updatedAt;
    child;
    healthProfessional;
};
exports.MedicalReport = MedicalReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MedicalReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], MedicalReport.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], MedicalReport.prototype, "healthProfessionalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MedicalReport.prototype, "diagnosis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], MedicalReport.prototype, "recommendations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], MedicalReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], MedicalReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Child_1.Child),
    __metadata("design:type", Child_1.Child)
], MedicalReport.prototype, "child", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => HealthProfessional_1.HealthProfessional),
    __metadata("design:type", HealthProfessional_1.HealthProfessional)
], MedicalReport.prototype, "healthProfessional", void 0);
exports.MedicalReport = MedicalReport = __decorate([
    (0, typeorm_1.Entity)()
], MedicalReport);
