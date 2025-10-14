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
exports.StationActivitySession = void 0;
const typeorm_1 = require("typeorm");
const Station_1 = require("./Station");
const ActivitySession_1 = require("./ActivitySession");
let StationActivitySession = class StationActivitySession {
    stationId;
    activitySessionId;
    stopNumber;
    scheduledAt;
    arrivedAt;
    leftAt;
    station;
    activitySession;
};
exports.StationActivitySession = StationActivitySession;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], StationActivitySession.prototype, "stationId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], StationActivitySession.prototype, "activitySessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], StationActivitySession.prototype, "stopNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StationActivitySession.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], StationActivitySession.prototype, "arrivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], StationActivitySession.prototype, "leftAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Station_1.Station),
    __metadata("design:type", Station_1.Station)
], StationActivitySession.prototype, "station", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ActivitySession_1.ActivitySession),
    __metadata("design:type", ActivitySession_1.ActivitySession)
], StationActivitySession.prototype, "activitySession", void 0);
exports.StationActivitySession = StationActivitySession = __decorate([
    (0, typeorm_1.Entity)()
], StationActivitySession);
