import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigration1759482783184 implements MigrationInterface {
    name = 'RefactorMigration1759482783184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station" DROP COLUMN "stop_number"`);
        await queryRunner.query(`ALTER TABLE "station_activity_session" ADD "stop_number" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station_activity_session" DROP COLUMN "stop_number"`);
        await queryRunner.query(`ALTER TABLE "station" ADD "stop_number" integer NOT NULL`);
    }

}
