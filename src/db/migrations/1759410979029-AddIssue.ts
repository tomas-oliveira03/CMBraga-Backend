import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIssue1759410979029 implements MigrationInterface {
    name = 'AddIssue1759410979029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "issue" ("id" character varying NOT NULL, "description" text NOT NULL, "images" character varying array NOT NULL DEFAULT '{}', "instructor_id" character varying, "activity_session_id" character varying, CONSTRAINT "PK_f80e086c249b9f3f3ff2fd321b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_004c0d4b6bc333ba0522ed6215e" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_c25e2e04077caf63fa80e55fcc8" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_c25e2e04077caf63fa80e55fcc8"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_004c0d4b6bc333ba0522ed6215e"`);
        await queryRunner.query(`DROP TABLE "issue"`);
    }

}
