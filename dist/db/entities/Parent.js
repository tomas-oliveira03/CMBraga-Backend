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
exports.Parent = void 0;
const typeorm_1 = require("typeorm");
const ParentChild_1 = require("./ParentChild");
const ChildActivitySession_1 = require("./ChildActivitySession");
const User_1 = require("./User");
let Parent = class Parent {
    id;
    name;
    email;
    password;
    phone;
    address;
    createdAt;
    activatedAt;
    updatedAt;
    parentChildren;
    parentChildActivitySession;
    user;
};
exports.Parent = Parent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Parent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Parent.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], Parent.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, select: false }),
    __metadata("design:type", String)
], Parent.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Parent.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Parent.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Parent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Parent.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Parent.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParentChild_1.ParentChild, parentChild => parentChild.parent),
    __metadata("design:type", Array)
], Parent.prototype, "parentChildren", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChildActivitySession_1.ChildActivitySession, childActivitySession => childActivitySession.parent),
    __metadata("design:type", Array)
], Parent.prototype, "parentChildActivitySession", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], Parent.prototype, "user", void 0);
exports.Parent = Parent = __decorate([
    (0, typeorm_1.Entity)()
], Parent);
