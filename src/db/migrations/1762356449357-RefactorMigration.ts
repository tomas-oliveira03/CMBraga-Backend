import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigration1762356449357 implements MigrationInterface {
    name = 'RefactorMigration1762356449357'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "uri" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "uri" DROP NOT NULL`);
    }

}
