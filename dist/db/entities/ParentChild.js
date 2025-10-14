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
exports.ParentChild = void 0;
const typeorm_1 = require("typeorm");
const Parent_1 = require("./Parent");
const Child_1 = require("./Child");
let ParentChild = class ParentChild {
    parentId;
    childId;
    associatedAt;
    parent;
    child;
};
exports.ParentChild = ParentChild;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ParentChild.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], ParentChild.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ParentChild.prototype, "associatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Parent_1.Parent),
    __metadata("design:type", Parent_1.Parent)
], ParentChild.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Child_1.Child),
    __metadata("design:type", Child_1.Child)
], ParentChild.prototype, "child", void 0);
exports.ParentChild = ParentChild = __decorate([
    (0, typeorm_1.Entity)()
], ParentChild);
