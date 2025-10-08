import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMigrationTable1759935467296 implements MigrationInterface {
    name = 'AddMigrationTable1759935467296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "child_activity_record" ("child_id" uuid NOT NULL, "activity_session_id" uuid NOT NULL, "distance_meters" integer NOT NULL, "duration_seconds" integer NOT NULL, "calories_burned" integer NOT NULL, CONSTRAINT "PK_c086db3444d54c4ddfac38fa833" PRIMARY KEY ("child_id", "activity_session_id"))`);
        await queryRunner.query(`ALTER TABLE "child_activity_record" ADD CONSTRAINT "FK_bd07eb52538d4f09d764557bcb1" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "child_activity_record" ADD CONSTRAINT "FK_bc028782ef193c5f9b48a1f761e" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child_activity_record" DROP CONSTRAINT "FK_bc028782ef193c5f9b48a1f761e"`);
        await queryRunner.query(`ALTER TABLE "child_activity_record" DROP CONSTRAINT "FK_bd07eb52538d4f09d764557bcb1"`);
        await queryRunner.query(`DROP TABLE "child_activity_record"`);
    }

}
