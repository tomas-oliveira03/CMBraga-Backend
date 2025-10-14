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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const Admin_1 = require("./Admin");
const Instructor_1 = require("./Instructor");
const Parent_1 = require("./Parent");
const HealthProfessional_1 = require("./HealthProfessional");
const UserChat_1 = require("./UserChat");
let User = class User {
    id;
    name;
    adminId;
    instructorId;
    parentId;
    healthProfessionalId;
    admin;
    instructor;
    parent;
    healthProfessional;
    chats;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "adminId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "instructorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "healthProfessionalId", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: "admin_id" }),
    (0, typeorm_1.OneToOne)(() => Admin_1.Admin, { nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "admin", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: "instructor_id" }),
    (0, typeorm_1.OneToOne)(() => Instructor_1.Instructor, { nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "instructor", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: "parent_id" }),
    (0, typeorm_1.OneToOne)(() => Parent_1.Parent, { nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: "health_professional_id" }),
    (0, typeorm_1.OneToOne)(() => HealthProfessional_1.HealthProfessional, { nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "healthProfessional", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserChat_1.UserChat, (userChat) => userChat.user),
    __metadata("design:type", Array)
], User.prototype, "chats", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)()
], User);
