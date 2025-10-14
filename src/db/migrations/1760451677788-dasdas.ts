import { MigrationInterface, QueryRunner } from "typeorm";

export class Dasdas1760451677788 implements MigrationInterface {
    name = 'Dasdas1760451677788'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" ADD "weather_temperature" integer`);
        await queryRunner.query(`ALTER TABLE "activity_session" ADD "weather_type" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" DROP COLUMN "weather_type"`);
        await queryRunner.query(`ALTER TABLE "activity_session" DROP COLUMN "weather_temperature"`);
    }

}
