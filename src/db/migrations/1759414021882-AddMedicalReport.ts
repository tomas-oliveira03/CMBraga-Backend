import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMedicalReport1759414021882 implements MigrationInterface {
    name = 'AddMedicalReport1759414021882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "health_professional" ("id" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "specialty" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_7c3d0d467324d1531ae2f003b2" CHECK ("specialty" IN ('pediatrician', 'nutritionist', 'general_practitioner')), CONSTRAINT "PK_a64d31c39d2af6daa453ea9f98e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_report" ("id" character varying NOT NULL, "child_id" character varying NOT NULL, "health_professional_id" character varying NOT NULL, "diagnosis" text NOT NULL, "recommendations" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3646662064ed9dbbe82e1efd19f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "admin" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "admin" ADD "updated_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "medical_report" ADD CONSTRAINT "FK_15750768b5712417a550e8ad986" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_report" ADD CONSTRAINT "FK_7b070ad0050b941833fcb184678" FOREIGN KEY ("health_professional_id") REFERENCES "health_professional"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_report" DROP CONSTRAINT "FK_7b070ad0050b941833fcb184678"`);
        await queryRunner.query(`ALTER TABLE "medical_report" DROP CONSTRAINT "FK_15750768b5712417a550e8ad986"`);
        await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "created_at"`);
        await queryRunner.query(`DROP TABLE "medical_report"`);
        await queryRunner.query(`DROP TABLE "health_professional"`);
    }

}
