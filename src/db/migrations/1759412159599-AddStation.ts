import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStation1759412159599 implements MigrationInterface {
    name = 'AddStation1759412159599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "station_activity_session" ("station_id" character varying NOT NULL, "activity_session_id" character varying NOT NULL, "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "arrived_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_3c452b1f7ee1f2cfcc2e8b1f941" PRIMARY KEY ("station_id", "activity_session_id"))`);
        await queryRunner.query(`CREATE TABLE "station" ("id" character varying NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_e7c2bf9c9e65e3c0b2bd036383" CHECK ("type" IN ('regular', 'school')), CONSTRAINT "PK_cad1b3e7182ef8df1057b82f6aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "issue" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "issue" ADD "updated_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "activity_session" ALTER COLUMN "finished_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "station_activity_session" ADD CONSTRAINT "FK_48139306c10b136f8e99513536e" FOREIGN KEY ("station_id") REFERENCES "station"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "station_activity_session" ADD CONSTRAINT "FK_18b72a4646c8cd18e3dca0525ca" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station_activity_session" DROP CONSTRAINT "FK_18b72a4646c8cd18e3dca0525ca"`);
        await queryRunner.query(`ALTER TABLE "station_activity_session" DROP CONSTRAINT "FK_48139306c10b136f8e99513536e"`);
        await queryRunner.query(`ALTER TABLE "activity_session" ALTER COLUMN "finished_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "created_at"`);
        await queryRunner.query(`DROP TABLE "station"`);
        await queryRunner.query(`DROP TABLE "station_activity_session"`);
    }

}
