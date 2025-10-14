import { MigrationInterface, QueryRunner } from "typeorm";

export class Dasdas1760454023869 implements MigrationInterface {
    name = 'Dasdas1760454023869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "admin_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_c143511e72fac735b8006051e55" UNIQUE ("admin_id")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "instructor_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_11c03fb8b962b9a304677f462f4" UNIQUE ("instructor_id")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "parent_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_acb096eef4d8b5acdd7acbb5c84" UNIQUE ("parent_id")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "health_professional_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_09a75d99124789b3ff569bb9b07" UNIQUE ("health_professional_id")`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c143511e72fac735b8006051e55" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_11c03fb8b962b9a304677f462f4" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_acb096eef4d8b5acdd7acbb5c84" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_09a75d99124789b3ff569bb9b07" FOREIGN KEY ("health_professional_id") REFERENCES "health_professional"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_09a75d99124789b3ff569bb9b07"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_acb096eef4d8b5acdd7acbb5c84"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_11c03fb8b962b9a304677f462f4"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c143511e72fac735b8006051e55"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_09a75d99124789b3ff569bb9b07"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "health_professional_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_acb096eef4d8b5acdd7acbb5c84"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "parent_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_11c03fb8b962b9a304677f462f4"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "instructor_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_c143511e72fac735b8006051e55"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "admin_id"`);
    }

}
