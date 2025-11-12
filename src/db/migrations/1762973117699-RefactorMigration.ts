import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigration1762973117699 implements MigrationInterface {
    name = 'RefactorMigration1762973117699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "route" DROP CONSTRAINT "CHK_d62262b6819579d7270a5dbe96"`);
        await queryRunner.query(`ALTER TABLE "route" ADD CONSTRAINT "CHK_eac8cf0c45107f25fcffea8d3a" CHECK ("color" IN ('red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "route" DROP CONSTRAINT "CHK_eac8cf0c45107f25fcffea8d3a"`);
        await queryRunner.query(`ALTER TABLE "route" ADD CONSTRAINT "CHK_d62262b6819579d7270a5dbe96" CHECK (((color)::text = ANY ((ARRAY['red'::character varying, 'blue'::character varying, 'green'::character varying, 'yellow'::character varying, 'orange'::character varying, 'purple'::character varying])::text[])))`);
    }

}
