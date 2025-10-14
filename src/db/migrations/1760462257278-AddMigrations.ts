import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMigrations1760462257278 implements MigrationInterface {
    name = 'AddMigrations1760462257278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instructor" ALTER COLUMN "activated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "instructor" ALTER COLUMN "activated_at" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instructor" ALTER COLUMN "activated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "instructor" ALTER COLUMN "activated_at" SET NOT NULL`);
    }

}
