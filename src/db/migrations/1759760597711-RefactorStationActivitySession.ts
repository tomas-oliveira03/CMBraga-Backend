import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorStationActivitySession1759760597711 implements MigrationInterface {
    name = 'RefactorStationActivitySession1759760597711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station_activity_session" ALTER COLUMN "arrived_at" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station_activity_session" ALTER COLUMN "arrived_at" SET NOT NULL`);
    }

}
