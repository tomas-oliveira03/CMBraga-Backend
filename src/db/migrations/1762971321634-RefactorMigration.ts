import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigration1762971321634 implements MigrationInterface {
    name = 'RefactorMigration1762971321634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "route" ADD "color" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route" ADD CONSTRAINT "CHK_d62262b6819579d7270a5dbe96" CHECK ("color" IN ('red', 'blue', 'green', 'yellow', 'orange', 'purple'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "route" DROP CONSTRAINT "CHK_d62262b6819579d7270a5dbe96"`);
        await queryRunner.query(`ALTER TABLE "route" DROP COLUMN "color"`);
    }

}
