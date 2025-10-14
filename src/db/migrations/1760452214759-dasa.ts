import { MigrationInterface, QueryRunner } from "typeorm";

export class Dasa1760452214759 implements MigrationInterface {
    name = 'Dasa1760452214759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" ADD CONSTRAINT "CHK_a51c61bc1985457ba5906afca1" CHECK ("weather_type" IN ('thunderstorm', 'drizzle', 'rain', 'snow', 'atmosphere', 'clear', 'clouds'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" DROP CONSTRAINT "CHK_a51c61bc1985457ba5906afca1"`);
    }

}
