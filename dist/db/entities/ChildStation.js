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
exports.ChildStation = void 0;
const typeorm_1 = require("typeorm");
const Child_1 = require("./Child");
const Station_1 = require("./Station");
const Instructor_1 = require("./Instructor");
const ActivitySession_1 = require("./ActivitySession");
const types_1 = require("../../helpers/types");
let ChildStation = class ChildStation {
    childId;
    stationId;
    type;
    instructorId;
    activitySessionId;
    registeredAt;
    child;
    station;
    instructor;
    activitySession;
};
exports.ChildStation = ChildStation;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildStation.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildStation.prototype, "stationId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildStation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildStation.prototype, "instructorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildStation.prototype, "activitySessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ChildStation.prototype, "registeredAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Child_1.Child),
    __metadata("design:type", Child_1.Child)
], ChildStation.prototype, "child", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Station_1.Station),
    __metadata("design:type", Station_1.Station)
], ChildStation.prototype, "station", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Instructor_1.Instructor),
    __metadata("design:type", Instructor_1.Instructor)
], ChildStation.prototype, "instructor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ActivitySession_1.ActivitySession),
    __metadata("design:type", ActivitySession_1.ActivitySession)
], ChildStation.prototype, "activitySession", void 0);
exports.ChildStation = ChildStation = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)(`"type" IN ('in', 'out')`)
], ChildStation);
