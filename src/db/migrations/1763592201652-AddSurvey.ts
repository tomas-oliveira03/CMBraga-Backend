import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSurvey1763592201652 implements MigrationInterface {
    name = 'AddSurvey1763592201652'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "survey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "parent_id" uuid NOT NULL, "child_id" uuid NOT NULL, "answers" jsonb NOT NULL, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f0da32b9181e9c02ecf0be11ed3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4bc8bb7f2f8d704ec00b062995" ON "survey" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c89ce7febd063faf1b11d06724" ON "survey" ("child_id") `);
        await queryRunner.query(`ALTER TABLE "survey" ADD CONSTRAINT "FK_4bc8bb7f2f8d704ec00b062995e" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "survey" ADD CONSTRAINT "FK_c89ce7febd063faf1b11d06724f" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey" DROP CONSTRAINT "FK_c89ce7febd063faf1b11d06724f"`);
        await queryRunner.query(`ALTER TABLE "survey" DROP CONSTRAINT "FK_4bc8bb7f2f8d704ec00b062995e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c89ce7febd063faf1b11d06724"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4bc8bb7f2f8d704ec00b062995"`);
        await queryRunner.query(`DROP TABLE "survey"`);
    }

}
