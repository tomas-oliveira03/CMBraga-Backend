import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentChild1759417843215 implements MigrationInterface {
    name = 'AddParentChild1759417843215'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child" DROP CONSTRAINT "FK_4157a24f3378c1e06ae3a942868"`);
        await queryRunner.query(`CREATE TABLE "parent_child" ("parent_id" character varying NOT NULL, "child_id" character varying NOT NULL, "associated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0b884bd66a60bc2ae117fc0bb09" PRIMARY KEY ("parent_id", "child_id"))`);
        await queryRunner.query(`ALTER TABLE "child" DROP COLUMN "parent_id"`);
        await queryRunner.query(`ALTER TABLE "parent_child" ADD CONSTRAINT "FK_583007013543f31bbce2c15a976" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_child" ADD CONSTRAINT "FK_9f61ce787dc165b3185b5f5d47f" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "parent_child" DROP CONSTRAINT "FK_9f61ce787dc165b3185b5f5d47f"`);
        await queryRunner.query(`ALTER TABLE "parent_child" DROP CONSTRAINT "FK_583007013543f31bbce2c15a976"`);
        await queryRunner.query(`ALTER TABLE "child" ADD "parent_id" character varying NOT NULL`);
        await queryRunner.query(`DROP TABLE "parent_child"`);
        await queryRunner.query(`ALTER TABLE "child" ADD CONSTRAINT "FK_4157a24f3378c1e06ae3a942868" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
