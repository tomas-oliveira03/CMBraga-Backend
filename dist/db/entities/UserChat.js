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
exports.UserChat = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Chat_1 = require("./Chat");
let UserChat = class UserChat {
    userId;
    chatId;
    user;
    chat;
};
exports.UserChat = UserChat;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], UserChat.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], UserChat.prototype, "chatId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], UserChat.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Chat_1.Chat),
    __metadata("design:type", Chat_1.Chat)
], UserChat.prototype, "chat", void 0);
exports.UserChat = UserChat = __decorate([
    (0, typeorm_1.Entity)()
], UserChat);
