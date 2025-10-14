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
exports.Instructor = void 0;
const typeorm_1 = require("typeorm");
const InstructorActivitySession_1 = require("./InstructorActivitySession");
const Issue_1 = require("./Issue");
const ChildStation_1 = require("./ChildStation");
const ActivitySession_1 = require("./ActivitySession");
const User_1 = require("./User");
let Instructor = class Instructor {
    id;
    name;
    email;
    password;
    phone;
    createdAt;
    activatedAt;
    updatedAt;
    instructorActivitySessions;
    issues;
    childStations;
    startedActivitySessions;
    finishedActivitySessions;
    user;
};
exports.Instructor = Instructor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Instructor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Instructor.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], Instructor.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, select: false }),
    __metadata("design:type", String)
], Instructor.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Instructor.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Instructor.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Instructor.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Instructor.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InstructorActivitySession_1.InstructorActivitySession, instructorActivitySession => instructorActivitySession.instructor),
    __metadata("design:type", Array)
], Instructor.prototype, "instructorActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Issue_1.Issue, (issue) => issue.instructor),
    __metadata("design:type", Array)
], Instructor.prototype, "issues", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildStation_1.ChildStation, childStation => childStation.instructor),
    __metadata("design:type", Array)
], Instructor.prototype, "childStations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ActivitySession_1.ActivitySession, activitySession => activitySession.startedBy),
    __metadata("design:type", Array)
], Instructor.prototype, "startedActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ActivitySession_1.ActivitySession, activitySession => activitySession.finishedBy),
    __metadata("design:type", Array)
], Instructor.prototype, "finishedActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], Instructor.prototype, "user", void 0);
exports.Instructor = Instructor = __decorate([
    (0, typeorm_1.Entity)()
], Instructor);
