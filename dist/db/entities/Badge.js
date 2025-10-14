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
exports.Badge = void 0;
const types_1 = require("../../helpers/types");
const typeorm_1 = require("typeorm");
let Badge = class Badge {
    id;
    name;
    description;
    imageUrl;
    criteria;
    valueneeded;
};
exports.Badge = Badge;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Badge.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { unique: true }),
    __metadata("design:type", String)
], Badge.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar"),
    __metadata("design:type", String)
], Badge.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar"),
    __metadata("design:type", String)
], Badge.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar"),
    __metadata("design:type", String)
], Badge.prototype, "criteria", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], Badge.prototype, "valueneeded", void 0);
exports.Badge = Badge = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)(`"criteria" IN ('streak', 'distance', 'calories', 'weather', 'points', 'special', 'leaderboard')`)
], Badge);
