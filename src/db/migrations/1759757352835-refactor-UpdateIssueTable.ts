import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorUpdateIssueTable1759757352835 implements MigrationInterface {
    name = 'RefactorUpdateIssueTable1759757352835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "issue" ADD "resolved_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "resolved_at"`);
    }

}
