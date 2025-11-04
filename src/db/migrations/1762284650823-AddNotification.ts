import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotification1762284650823 implements MigrationInterface {
    name = 'AddNotification1762284650823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification" ("id" character varying NOT NULL, "user_id" character varying NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "uri" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_928b7aa1754e08e1ed7052cb9d" ON "notification" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_928b7aa1754e08e1ed7052cb9d"`);
        await queryRunner.query(`DROP TABLE "notification"`);
    }

}
