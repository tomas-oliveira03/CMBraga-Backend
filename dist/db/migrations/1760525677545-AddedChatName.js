"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddedChatName1760525677545 = void 0;
class AddedChatName1760525677545 {
    name = 'AddedChatName1760525677545';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat" ADD "chat_name" character varying`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "chat_name"`);
    }
}
exports.AddedChatName1760525677545 = AddedChatName1760525677545;
