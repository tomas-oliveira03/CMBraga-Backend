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
exports.Station = void 0;
const typeorm_1 = require("typeorm");
const StationActivitySession_1 = require("./StationActivitySession");
const ChildStation_1 = require("./ChildStation");
const types_1 = require("../../helpers/types");
const Child_1 = require("./Child");
const ChildActivitySession_1 = require("./ChildActivitySession");
let Station = class Station {
    id;
    name;
    type;
    createdAt;
    updatedAt;
    stationActivitySessions;
    childStations;
    dropOffStationChildren;
    pickUpchildActivitySessions;
};
exports.Station = Station;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Station.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Station.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Station.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Station.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Station.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StationActivitySession_1.StationActivitySession, stationActivitySession => stationActivitySession.station),
    __metadata("design:type", Array)
], Station.prototype, "stationActivitySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildStation_1.ChildStation, childStation => childStation.station),
    __metadata("design:type", Array)
], Station.prototype, "childStations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Child_1.Child, child => child.dropOffStation),
    __metadata("design:type", Array)
], Station.prototype, "dropOffStationChildren", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildActivitySession_1.ChildActivitySession, childActivitySession => childActivitySession.pickUpStation),
    __metadata("design:type", Array)
], Station.prototype, "pickUpchildActivitySessions", void 0);
exports.Station = Station = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)(`"type" IN ('regular', 'school')`)
], Station);
