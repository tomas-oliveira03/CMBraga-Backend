import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigration1759489910184 implements MigrationInterface {
    name = 'RefactorMigration1759489910184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" ADD "updated_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" DROP COLUMN "updated_at"`);
    }

}
