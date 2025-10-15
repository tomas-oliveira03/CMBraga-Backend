import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedChatName1760525677545 implements MigrationInterface {
    name = 'AddedChatName1760525677545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" ADD "chat_name" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "chat_name"`);
    }

}
