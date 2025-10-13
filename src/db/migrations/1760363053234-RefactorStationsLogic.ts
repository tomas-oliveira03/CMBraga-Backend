import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorStationsLogic1760363053234 implements MigrationInterface {
    name = 'RefactorStationsLogic1760363053234'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "station_activity_session" ADD "left_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" ADD "is_late_registration" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" DROP CONSTRAINT "PK_18ca9ceacbf1a4c7ed103ca4339"`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" ADD CONSTRAINT "PK_604103384948cc23645011cbc10" PRIMARY KEY ("child_id", "activity_session_id", "parent_id", "is_late_registration")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child_activity_session" DROP CONSTRAINT "PK_604103384948cc23645011cbc10"`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" ADD CONSTRAINT "PK_18ca9ceacbf1a4c7ed103ca4339" PRIMARY KEY ("child_id", "activity_session_id", "parent_id")`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" DROP COLUMN "is_late_registration"`);
        await queryRunner.query(`ALTER TABLE "station_activity_session" DROP COLUMN "left_at"`);
    }

}
