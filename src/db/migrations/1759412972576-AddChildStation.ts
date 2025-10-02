import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChildStation1759412972576 implements MigrationInterface {
    name = 'AddChildStation1759412972576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "child_station" ("child_id" character varying NOT NULL, "station_id" character varying NOT NULL, "instructor_id" character varying NOT NULL, "activity_session_id" character varying NOT NULL, "type" character varying NOT NULL, "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_6288dedacb93c8a5deb652e03b" CHECK ("type" IN ('in', 'out')), CONSTRAINT "PK_026602e21388c315b5b4dc17b4b" PRIMARY KEY ("child_id", "station_id"))`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_004c0d4b6bc333ba0522ed6215e"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_c25e2e04077caf63fa80e55fcc8"`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "instructor_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "activity_session_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child" DROP CONSTRAINT "FK_4157a24f3378c1e06ae3a942868"`);
        await queryRunner.query(`ALTER TABLE "child" ALTER COLUMN "parent_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_004c0d4b6bc333ba0522ed6215e" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_c25e2e04077caf63fa80e55fcc8" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "child" ADD CONSTRAINT "FK_4157a24f3378c1e06ae3a942868" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "child_station" ADD CONSTRAINT "FK_c3b9a250b4ad2797f1b59ac7984" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "child_station" ADD CONSTRAINT "FK_8b35afd38690c8328420a307420" FOREIGN KEY ("station_id") REFERENCES "station"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "child_station" ADD CONSTRAINT "FK_4b06506b41928830009d16a306b" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "child_station" ADD CONSTRAINT "FK_f87d8bec6ad18475aaf1e630411" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child_station" DROP CONSTRAINT "FK_f87d8bec6ad18475aaf1e630411"`);
        await queryRunner.query(`ALTER TABLE "child_station" DROP CONSTRAINT "FK_4b06506b41928830009d16a306b"`);
        await queryRunner.query(`ALTER TABLE "child_station" DROP CONSTRAINT "FK_8b35afd38690c8328420a307420"`);
        await queryRunner.query(`ALTER TABLE "child_station" DROP CONSTRAINT "FK_c3b9a250b4ad2797f1b59ac7984"`);
        await queryRunner.query(`ALTER TABLE "child" DROP CONSTRAINT "FK_4157a24f3378c1e06ae3a942868"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_c25e2e04077caf63fa80e55fcc8"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_004c0d4b6bc333ba0522ed6215e"`);
        await queryRunner.query(`ALTER TABLE "child" ALTER COLUMN "parent_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "child" ADD CONSTRAINT "FK_4157a24f3378c1e06ae3a942868" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "activity_session_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "instructor_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_c25e2e04077caf63fa80e55fcc8" FOREIGN KEY ("activity_session_id") REFERENCES "activity_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_004c0d4b6bc333ba0522ed6215e" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP TABLE "child_station"`);
    }

}
