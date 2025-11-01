import { MigrationInterface, QueryRunner } from "typeorm";

export class Corrected1762012397184 implements MigrationInterface {
    name = 'Corrected1762012397184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "parent_stat" DROP CONSTRAINT "FK_ca4ecb9d931ab8c9c5b772990cf"`);
        await queryRunner.query(`ALTER TABLE "parent_stat" ALTER COLUMN "parent_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "parent_stat" ALTER COLUMN "child_stat_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "parent_stat" ADD CONSTRAINT "FK_ca4ecb9d931ab8c9c5b772990cf" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "parent_stat" DROP CONSTRAINT "FK_ca4ecb9d931ab8c9c5b772990cf"`);
        await queryRunner.query(`ALTER TABLE "parent_stat" ALTER COLUMN "child_stat_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "parent_stat" ALTER COLUMN "parent_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "parent_stat" ADD CONSTRAINT "FK_ca4ecb9d931ab8c9c5b772990cf" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
