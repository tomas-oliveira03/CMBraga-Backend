import { MigrationInterface, QueryRunner } from "typeorm";

export class SeenInChat1762281735153 implements MigrationInterface {
    name = 'SeenInChat1762281735153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_chat" ADD "seen" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_chat" DROP COLUMN "seen"`);
    }

}
