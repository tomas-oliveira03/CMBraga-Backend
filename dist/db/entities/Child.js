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
exports.Child = void 0;
const typeorm_1 = require("typeorm");
const ChildActivitySession_1 = require("./ChildActivitySession");
const ChildStation_1 = require("./ChildStation");
const MedicalReport_1 = require("./MedicalReport");
const ParentChild_1 = require("./ParentChild");
const types_1 = require("../../helpers/types");
const Station_1 = require("./Station");
const ChildActivityRecord_1 = require("./ChildActivityRecord");
let Child = class Child {
    id;
    name;
    gender;
    school;
    schoolGrade;
    // Station where the child is dropped off to school
    dropOffStationId;
    dateOfBirth;
    healthProblems;
    createdAt;
    updatedAt;
    childActivitySessions;
    childActivityRecords;
    childStations;
    medicalReports;
    parentChildren;
    dropOffStation;
};
exports.Child = Child;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Child.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Child.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Child.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Child.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Child.prototype, "schoolGrade", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Child.prototype, "dropOffStationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Child.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Child.prototype, "healthProblems", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Child.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Child.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildActivitySession_1.ChildActivitySession, childActivitySession => childActivitySession.child),
    __metadata("design:type", Array)
], Child.prototype, "childActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildActivityRecord_1.ChildActivityRecord, childActivityRecord => childActivityRecord.child),
    __metadata("design:type", Array)
], Child.prototype, "childActivityRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildStation_1.ChildStation, childStation => childStation.child),
    __metadata("design:type", Array)
], Child.prototype, "childStations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MedicalReport_1.MedicalReport, medicalReport => medicalReport.child),
    __metadata("design:type", Array)
], Child.prototype, "medicalReports", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParentChild_1.ParentChild, parentChild => parentChild.child),
    __metadata("design:type", Array)
], Child.prototype, "parentChildren", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Station_1.Station),
    __metadata("design:type", Station_1.Station)
], Child.prototype, "dropOffStation", void 0);
exports.Child = Child = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)(`"gender" IN ('male', 'female')`)
], Child);
