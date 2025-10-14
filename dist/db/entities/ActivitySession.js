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
exports.ActivitySession = void 0;
const typeorm_1 = require("typeorm");
const ChildActivitySession_1 = require("./ChildActivitySession");
const InstructorActivitySession_1 = require("./InstructorActivitySession");
const StationActivitySession_1 = require("./StationActivitySession");
const ParentActivitySession_1 = require("./ParentActivitySession");
const Issue_1 = require("./Issue");
const ChildStation_1 = require("./ChildStation");
const types_1 = require("../../helpers/types");
const Instructor_1 = require("./Instructor");
const ChildActivityRecord_1 = require("./ChildActivityRecord");
let ActivitySession = class ActivitySession {
    id;
    type;
    mode;
    inLateRegistration;
    weatherTemperature;
    weatherType;
    scheduledAt;
    startedById;
    startedAt;
    finishedById;
    finishedAt;
    createdAt;
    updatedAt;
    // Relationships
    childActivitySessions;
    instructorActivitySessions;
    parentActivitySessions;
    stationActivitySessions;
    issues;
    childStations;
    childActivityRecords;
    startedBy;
    finishedBy;
};
exports.ActivitySession = ActivitySession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ActivitySession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], ActivitySession.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], ActivitySession.prototype, "mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], ActivitySession.prototype, "inLateRegistration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "weatherTemperature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "weatherType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], ActivitySession.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "startedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "finishedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], ActivitySession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildActivitySession_1.ChildActivitySession, (cas) => cas.activitySession),
    __metadata("design:type", Array)
], ActivitySession.prototype, "childActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InstructorActivitySession_1.InstructorActivitySession, (ias) => ias.activitySession),
    __metadata("design:type", Array)
], ActivitySession.prototype, "instructorActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParentActivitySession_1.ParentActivitySession, (pas) => pas.activitySession),
    __metadata("design:type", Array)
], ActivitySession.prototype, "parentActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StationActivitySession_1.StationActivitySession, (sas) => sas.activitySession),
    __metadata("design:type", Array)
], ActivitySession.prototype, "stationActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Issue_1.Issue, (issue) => issue.activitySession),
    __metadata("design:type", Array)
], ActivitySession.prototype, "issues", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildStation_1.ChildStation, (childStation) => childStation.activitySession),
    __metadata("design:type", Array)
], ActivitySession.prototype, "childStations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildActivityRecord_1.ChildActivityRecord, childActivityRecord => childActivityRecord.child),
    __metadata("design:type", Array)
], ActivitySession.prototype, "childActivityRecords", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Instructor_1.Instructor, { nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "startedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Instructor_1.Instructor, { nullable: true }),
    __metadata("design:type", Object)
], ActivitySession.prototype, "finishedBy", void 0);
exports.ActivitySession = ActivitySession = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)(`"type" IN ('pedibus', 'ciclo_expresso')`),
    (0, typeorm_1.Check)(`"mode" IN ('walk', 'bike')`),
    (0, typeorm_1.Check)(`"weather_type" IN ('thunderstorm', 'drizzle', 'rain', 'snow', 'atmosphere', 'clear', 'clouds')`)
], ActivitySession);
