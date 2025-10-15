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
exports.Chat = void 0;
const typeorm_1 = require("typeorm");
const types_1 = require("../../helpers/types");
const Message_1 = require("./Message");
const UserChat_1 = require("./UserChat");
let Chat = class Chat {
    id;
    chatName;
    chatType;
    destinatairePhoto;
    messages;
    userChat;
};
exports.Chat = Chat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Chat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Chat.prototype, "chatName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Chat.prototype, "chatType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Chat.prototype, "destinatairePhoto", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Message_1.Message, message => message.chat),
    __metadata("design:type", Array)
], Chat.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserChat_1.UserChat, userChat => userChat.chat),
    __metadata("design:type", Array)
], Chat.prototype, "userChat", void 0);
exports.Chat = Chat = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)(`"chat_type" IN ('group_chat', 'individual_chat')`)
], Chat);
