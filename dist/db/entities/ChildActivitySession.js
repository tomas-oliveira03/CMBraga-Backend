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
exports.ChildActivitySession = void 0;
const typeorm_1 = require("typeorm");
const Child_1 = require("./Child");
const ActivitySession_1 = require("./ActivitySession");
const Station_1 = require("./Station");
const Parent_1 = require("./Parent");
let ChildActivitySession = class ChildActivitySession {
    childId;
    activitySessionId;
    parentId;
    isLateRegistration;
    registeredAt;
    // Station where the child is picked up to school
    pickUpStationId;
    child;
    activitySession;
    pickUpStation;
    parent;
};
exports.ChildActivitySession = ChildActivitySession;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildActivitySession.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildActivitySession.prototype, "activitySessionId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildActivitySession.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], ChildActivitySession.prototype, "isLateRegistration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ChildActivitySession.prototype, "registeredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ChildActivitySession.prototype, "pickUpStationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Child_1.Child),
    __metadata("design:type", Child_1.Child)
], ChildActivitySession.prototype, "child", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ActivitySession_1.ActivitySession),
    __metadata("design:type", ActivitySession_1.ActivitySession)
], ChildActivitySession.prototype, "activitySession", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Station_1.Station),
    __metadata("design:type", Station_1.Station)
], ChildActivitySession.prototype, "pickUpStation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Parent_1.Parent),
    __metadata("design:type", Parent_1.Parent)
], ChildActivitySession.prototype, "parent", void 0);
exports.ChildActivitySession = ChildActivitySession = __decorate([
    (0, typeorm_1.Entity)()
], ChildActivitySession);
