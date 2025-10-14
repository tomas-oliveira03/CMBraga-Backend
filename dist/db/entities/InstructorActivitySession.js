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
exports.InstructorActivitySession = void 0;
const typeorm_1 = require("typeorm");
const Instructor_1 = require("./Instructor");
const ActivitySession_1 = require("./ActivitySession");
let InstructorActivitySession = class InstructorActivitySession {
    instructorId;
    activitySessionId;
    assignedAt;
    instructor;
    activitySession;
};
exports.InstructorActivitySession = InstructorActivitySession;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], InstructorActivitySession.prototype, "instructorId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], InstructorActivitySession.prototype, "activitySessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], InstructorActivitySession.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Instructor_1.Instructor),
    __metadata("design:type", Instructor_1.Instructor)
], InstructorActivitySession.prototype, "instructor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ActivitySession_1.ActivitySession),
    __metadata("design:type", ActivitySession_1.ActivitySession)
], InstructorActivitySession.prototype, "activitySession", void 0);
exports.InstructorActivitySession = InstructorActivitySession = __decorate([
    (0, typeorm_1.Entity)()
], InstructorActivitySession);
