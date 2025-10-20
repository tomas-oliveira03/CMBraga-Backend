import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMigration1760997938283 implements MigrationInterface {
    name = 'AddMigration1760997938283'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "parent_station" ("parent_id" uuid NOT NULL, "instructor_id" uuid NOT NULL, "activity_session_id" uuid NOT NULL, "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0ec0ec83d30cd18f0aaf1bb53f0" PRIMARY KEY ("parent_id"))`);
        await queryRunner.query(`ALTER TABLE "parent_station" ADD CONSTRAINT "FK_0ec0ec83d30cd18f0aaf1bb53f0" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_station" ADD CONSTRAINT "FK_a9e7e99f4bec4c9a33f8f21e61a" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_station" ADD CONSTRAINT "FK_faa105d69140348c91b0f862e99" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "parent_station" DROP CONSTRAINT "FK_faa105d69140348c91b0f862e99"`);
        await queryRunner.query(`ALTER TABLE "parent_station" DROP CONSTRAINT "FK_a9e7e99f4bec4c9a33f8f21e61a"`);
        await queryRunner.query(`ALTER TABLE "parent_station" DROP CONSTRAINT "FK_0ec0ec83d30cd18f0aaf1bb53f0"`);
        await queryRunner.query(`DROP TABLE "parent_station"`);
    }

}
