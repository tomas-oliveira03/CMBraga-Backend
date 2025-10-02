import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChild1759402153452 implements MigrationInterface {
    name = 'AddChild1759402153452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "child" ("id" character varying NOT NULL, "name" character varying NOT NULL, "gender" character varying NOT NULL, "school" character varying NOT NULL, "date_of_birth" date NOT NULL, "health_problems" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE, "parent_id" character varying, CONSTRAINT "CHK_3385608ebec1fb7bb29020243c" CHECK ("gender" IN ('male', 'female')), CONSTRAINT "PK_4609b9b323ca37c6bc435ec4b6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "child" ADD CONSTRAINT "FK_4157a24f3378c1e06ae3a942868" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child" DROP CONSTRAINT "FK_4157a24f3378c1e06ae3a942868"`);
        await queryRunner.query(`DROP TABLE "child"`);
    }

}
