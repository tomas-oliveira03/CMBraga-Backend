import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorStation1759417439136 implements MigrationInterface {
    name = 'RefactorStation1759417439136'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station" ADD "stop_number" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station" DROP COLUMN "stop_number"`);
    }

}
