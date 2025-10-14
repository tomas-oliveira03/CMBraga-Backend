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
exports.ClientStat = void 0;
const typeorm_1 = require("typeorm");
const Parent_1 = require("./Parent");
const Child_1 = require("./Child");
let ClientStat = class ClientStat {
    id;
    parentId;
    childId;
    metersWalked;
    co2Saved;
    caloriesBurned;
    date;
    activitySessionId;
    parent;
    child;
};
exports.ClientStat = ClientStat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ClientStat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ClientStat.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ClientStat.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClientStat.prototype, "metersWalked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClientStat.prototype, "co2Saved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClientStat.prototype, "caloriesBurned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ClientStat.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ClientStat.prototype, "activitySessionId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Parent_1.Parent, { nullable: true }),
    __metadata("design:type", Object)
], ClientStat.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Child_1.Child, { nullable: true }),
    __metadata("design:type", Object)
], ClientStat.prototype, "child", void 0);
exports.ClientStat = ClientStat = __decorate([
    (0, typeorm_1.Entity)()
], ClientStat);
