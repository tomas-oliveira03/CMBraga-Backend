import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigrationActivity1759487699860 implements MigrationInterface {
    name = 'RefactorMigrationActivity1759487699860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" ALTER COLUMN "started_at" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" ALTER COLUMN "started_at" SET NOT NULL`);
    }

}
