import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActivitySession1759409823048 implements MigrationInterface {
    name = 'AddActivitySession1759409823048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "activity_session" ("id" character varying NOT NULL, "type" character varying NOT NULL, "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "finished_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_60459c8424dfa4b118e615488b" CHECK ("type" IN ('pedibus', 'ciclo_expresso')), CONSTRAINT "PK_b1eec88abee31d02a6790463abb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "child_activity_session" ("child_id" character varying NOT NULL, "activity_session_id" character varying NOT NULL, "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b259dbff899f986441575fd3d26" PRIMARY KEY ("child_id", "activity_session_id"))`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" ADD CONSTRAINT "FK_79dc85c70337d169340f2d53fea" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" ADD CONSTRAINT "FK_37c262056788545ca929955298c" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child_activity_session" DROP CONSTRAINT "FK_37c262056788545ca929955298c"`);
        await queryRunner.query(`ALTER TABLE "child_activity_session" DROP CONSTRAINT "FK_79dc85c70337d169340f2d53fea"`);
        await queryRunner.query(`DROP TABLE "child_activity_session"`);
        await queryRunner.query(`DROP TABLE "activity_session"`);
    }

}
