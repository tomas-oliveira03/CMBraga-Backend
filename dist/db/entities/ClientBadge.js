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
exports.ClientBadge = void 0;
const typeorm_1 = require("typeorm");
const Badge_1 = require("./Badge");
const Parent_1 = require("./Parent");
const Child_1 = require("./Child");
let ClientBadge = class ClientBadge {
    id;
    parentId;
    childId;
    badgeId;
    parent;
    child;
    badge;
};
exports.ClientBadge = ClientBadge;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ClientBadge.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientBadge.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientBadge.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ClientBadge.prototype, "badgeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Parent_1.Parent),
    __metadata("design:type", Object)
], ClientBadge.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Child_1.Child),
    __metadata("design:type", Object)
], ClientBadge.prototype, "child", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Badge_1.Badge),
    __metadata("design:type", Object)
], ClientBadge.prototype, "badge", void 0);
exports.ClientBadge = ClientBadge = __decorate([
    (0, typeorm_1.Entity)()
], ClientBadge);
