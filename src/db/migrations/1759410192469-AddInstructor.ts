import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstructor1759410192469 implements MigrationInterface {
    name = 'AddInstructor1759410192469'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "instructor" ("id" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "phone" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ccc0348eefb581ca002c05ef2f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "instructor_activity_session" ("instructor_id" character varying NOT NULL, "activity_session_id" character varying NOT NULL, "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ce4be5546999080c882bcfacf56" PRIMARY KEY ("instructor_id", "activity_session_id"))`);
        await queryRunner.query(`ALTER TABLE "instructor_activity_session" ADD CONSTRAINT "FK_62c328685da034db02291d6bee9" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "instructor_activity_session" ADD CONSTRAINT "FK_e2f2a46ae5c260a36fd5674caf0" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instructor_activity_session" DROP CONSTRAINT "FK_e2f2a46ae5c260a36fd5674caf0"`);
        await queryRunner.query(`ALTER TABLE "instructor_activity_session" DROP CONSTRAINT "FK_62c328685da034db02291d6bee9"`);
        await queryRunner.query(`DROP TABLE "instructor_activity_session"`);
        await queryRunner.query(`DROP TABLE "instructor"`);
    }

}
