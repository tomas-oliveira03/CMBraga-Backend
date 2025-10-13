import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserStat1760362460385 implements MigrationInterface {
    name = 'AddUserStat1760362460385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_stat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "parentid" uuid, "child_id" uuid, "meters_walked" integer NOT NULL DEFAULT '0', "co2_saved" integer NOT NULL DEFAULT '0', "calories_burned" integer NOT NULL DEFAULT '0', "date" date NOT NULL, "activity_session_id" uuid NOT NULL, CONSTRAINT "PK_d50934a678f287072b9f949123f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_stat"`);
    }

}
