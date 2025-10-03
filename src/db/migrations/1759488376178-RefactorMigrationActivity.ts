import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigrationActivity1759488376178 implements MigrationInterface {
    name = 'RefactorMigrationActivity1759488376178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" DROP COLUMN "updated_at"`);
    }

}
