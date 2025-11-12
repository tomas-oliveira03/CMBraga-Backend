import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMigration1762974353213 implements MigrationInterface {
    name = 'RefactorMigration1762974353213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child_history" ALTER COLUMN "height_centimeters" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child_history" ALTER COLUMN "weight_kilograms" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child" ALTER COLUMN "height_centimeters" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child" ALTER COLUMN "weight_kilograms" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child" ALTER COLUMN "weight_kilograms" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child" ALTER COLUMN "height_centimeters" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child_history" ALTER COLUMN "weight_kilograms" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child_history" ALTER COLUMN "height_centimeters" SET NOT NULL`);
    }

}
