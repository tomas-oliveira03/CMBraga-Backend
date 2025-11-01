import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovedField1762024976143 implements MigrationInterface {
    name = 'RemovedField1762024976143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "sender_name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" ADD "sender_name" character varying NOT NULL`);
    }

}
