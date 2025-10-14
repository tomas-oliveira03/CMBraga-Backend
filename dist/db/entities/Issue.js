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
exports.Issue = void 0;
const typeorm_1 = require("typeorm");
const Instructor_1 = require("./Instructor");
const ActivitySession_1 = require("./ActivitySession");
let Issue = class Issue {
    id;
    description;
    images;
    createdAt;
    updatedAt;
    resolvedAt;
    instructorId;
    activitySessionId;
    instructor;
    activitySession;
};
exports.Issue = Issue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Issue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Issue.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', array: true, default: [] }),
    __metadata("design:type", Array)
], Issue.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Issue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Issue.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Issue.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Issue.prototype, "instructorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Issue.prototype, "activitySessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Instructor_1.Instructor),
    __metadata("design:type", Instructor_1.Instructor)
], Issue.prototype, "instructor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ActivitySession_1.ActivitySession),
    __metadata("design:type", ActivitySession_1.ActivitySession)
], Issue.prototype, "activitySession", void 0);
exports.Issue = Issue = __decorate([
    (0, typeorm_1.Entity)()
], Issue);
