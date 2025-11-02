import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMigration1762082920839 implements MigrationInterface {
    name = 'AddMigration1762082920839'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_8c7c73f1194ffc69f9e736a911" ON "child_stat" ("child_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8c7c73f1194ffc69f9e736a911"`);
    }

}
