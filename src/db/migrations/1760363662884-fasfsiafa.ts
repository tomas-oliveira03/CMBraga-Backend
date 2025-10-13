import { MigrationInterface, QueryRunner } from "typeorm";

export class Fasfsiafa1760363662884 implements MigrationInterface {
    name = 'Fasfsiafa1760363662884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" RENAME COLUMN "is_closed" TO "in_late_registration"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_session" RENAME COLUMN "in_late_registration" TO "is_closed"`);
    }

}
