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
exports.ChildActivityRecord = void 0;
const typeorm_1 = require("typeorm");
const ActivitySession_1 = require("./ActivitySession");
const Child_1 = require("./Child");
let ChildActivityRecord = class ChildActivityRecord {
    childId;
    activitySessionId;
    distanceMeters;
    durationSeconds;
    caloriesBurned;
    child;
    activitySession;
};
exports.ChildActivityRecord = ChildActivityRecord;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildActivityRecord.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildActivityRecord.prototype, "activitySessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ChildActivityRecord.prototype, "distanceMeters", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ChildActivityRecord.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ChildActivityRecord.prototype, "caloriesBurned", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Child_1.Child),
    __metadata("design:type", Child_1.Child)
], ChildActivityRecord.prototype, "child", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ActivitySession_1.ActivitySession),
    __metadata("design:type", ActivitySession_1.ActivitySession)
], ChildActivityRecord.prototype, "activitySession", void 0);
exports.ChildActivityRecord = ChildActivityRecord = __decorate([
    (0, typeorm_1.Entity)()
], ChildActivityRecord);
