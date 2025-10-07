import "reflect-metadata";
import { AppDataSource } from "@/db";
import { Station } from "@/db/entities/Station";
import { Parent } from "@/db/entities/Parent";
import { Child } from "@/db/entities/Child";
import { ParentChild } from "@/db/entities/ParentChild";
import { Instructor } from "@/db/entities/Instructor";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { Admin } from "@/db/entities/Admin";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { InstructorActivitySession } from "@/db/entities/InstructorActivitySession";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { ChildStation } from "@/db/entities/ChildStation";
import { Issue } from "@/db/entities/Issue";
import { MedicalReport } from "@/db/entities/MedicalReport";
import informationHash from "@/lib/information-hash";

async function seed() {
  console.log("Initializing data source...");
  const dataSource = await AppDataSource.initialize();

  try {
    // Repositories
    const stationRepo = dataSource.getRepository(Station);
    const parentRepo = dataSource.getRepository(Parent);
    const childRepo = dataSource.getRepository(Child);
    const parentChildRepo = dataSource.getRepository(ParentChild);
    const instructorRepo = dataSource.getRepository(Instructor);
    const hpRepo = dataSource.getRepository(HealthProfessional);
    const adminRepo = dataSource.getRepository(Admin);
    const activityRepo = dataSource.getRepository(ActivitySession);
    const childActivityRepo = dataSource.getRepository(ChildActivitySession);
    const instructorActivityRepo = dataSource.getRepository(InstructorActivitySession);
    const stationActivityRepo = dataSource.getRepository(StationActivitySession);
    const childStationRepo = dataSource.getRepository(ChildStation);
    const issueRepo = dataSource.getRepository(Issue);
    const reportRepo = dataSource.getRepository(MedicalReport);

    console.log("Cleaning tables (dependents first)...");
    // Clear repositories in order, but ignore errors if the table doesn't exist yet
    const reposToClear = [
      childActivityRepo,
      instructorActivityRepo,
      stationActivityRepo,
      childStationRepo,
      issueRepo,
      reportRepo,
      parentChildRepo,
      childRepo,
      parentRepo,
      instructorRepo,
      hpRepo,
      stationRepo,
      activityRepo,
      adminRepo,
    ];

    for (const repo of reposToClear) {
      const table = repo.metadata.tableName;
      try {
        // Check existence using to_regclass and only truncate when present
        const existsRes = await dataSource.query(`SELECT to_regclass($1) AS reg`, [`public.${table}`]);
        const exists = Array.isArray(existsRes) && existsRes[0] && existsRes[0].reg;
        if (exists) {
          await dataSource.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
        } else {
          console.warn(`Table ${table} does not exist, skipping truncate.`);
        }
      } catch (err: any) {
        console.warn(`Skipping truncate for ${table}: ${err?.message || err}`);
      }
    }

    console.log("Inserting base records...");
    
    const encryptedPassword = informationHash.encrypt("1234");

    // Stations
    const stationA = stationRepo.create({ name: "Estação Central", type: "regular" as any });
    const stationB = stationRepo.create({ name: "Escola Básica", type: "school" as any });
    await stationRepo.save([stationA, stationB]);

    // Parents
    const parent1 = parentRepo.create({ name: "João Silva", email: "joao.silva@example.com", password: encryptedPassword, phone: "912345678", address: "Rua A, 1" });
    const parent2 = parentRepo.create({ name: "Ana Costa", email: "ana.costa@example.com", password: encryptedPassword, phone: "923456789", address: "Rua B, 2" });
    await parentRepo.save([parent1, parent2]);

    // Health professional
    const hp1 = hpRepo.create({ name: "Dra. Marta Ramos", email: "marta.ramos@saude.pt", password: encryptedPassword, specialty: "pediatrician" as any });
    await hpRepo.save(hp1);

    // Admin
    const admin = adminRepo.create({ name: "Admin", email: "admin@example.com", password: encryptedPassword });
    await adminRepo.save(admin);

    // Instructors
    const instructor1 = instructorRepo.create({ name: "Instrutor A", email: "instrutor.a@example.com", password: encryptedPassword, phone: "911111111" });
    const instructor2 = instructorRepo.create({ name: "Instrutor B", email: "instrutor.b@example.com", password: encryptedPassword, phone: "922222222" });
    await instructorRepo.save([instructor1, instructor2]);

    // Children
    const child1 = childRepo.create({ 
      name: "Miguel Pereira", 
      gender: "male" as any, 
      school: "Escola Básica", 
      schoolGrade: 4,
      stationId: stationA.id, 
      dateOfBirth: new Date("2016-02-14") 
    });
    const child2 = childRepo.create({ 
      name: "Sofia Gomes", 
      gender: "female" as any, 
      school: "Escola Secundária", 
      schoolGrade: 7,
      stationId: stationB.id, 
      dateOfBirth: new Date("2015-08-25") 
    });
    await childRepo.save([child1, child2]);

    // Parent-child associations
    const pc1 = parentChildRepo.create({ parentId: parent1.id, childId: child1.id });
    const pc2 = parentChildRepo.create({ parentId: parent2.id, childId: child2.id });
    await parentChildRepo.save([pc1, pc2]);

    // Activity sessions
    const activity1 = activityRepo.create({ type: "pedibus" as any, scheduledAt: new Date("2024-03-01T09:00:00.000Z") });
    const activity2 = activityRepo.create({ type: "ciclo_expresso" as any, scheduledAt: new Date("2024-03-02T09:00:00.000Z") });
    await activityRepo.save([activity1, activity2]);

    // ChildActivitySession
    const cas1 = childActivityRepo.create({ 
      childId: child1.id, 
      activitySessionId: activity1.id, 
      stationId: stationA.id,
      parentId: parent1.id 
    });
    const cas2 = childActivityRepo.create({ 
      childId: child2.id, 
      activitySessionId: activity2.id, 
      stationId: stationB.id,
      parentId: parent2.id 
    });
    await childActivityRepo.save([cas1, cas2]);

    // InstructorActivitySession
    const ias1 = instructorActivityRepo.create({ instructorId: instructor1.id, activitySessionId: activity1.id });
    const ias2 = instructorActivityRepo.create({ instructorId: instructor2.id, activitySessionId: activity2.id });
    await instructorActivityRepo.save([ias1, ias2]);

    // StationActivitySession
    const sas1 = stationActivityRepo.create({ stationId: stationA.id, activitySessionId: activity1.id, stopNumber: 1, scheduledAt: activity1.scheduledAt });
    const sas2 = stationActivityRepo.create({ stationId: stationB.id, activitySessionId: activity2.id, stopNumber: 1, scheduledAt: activity2.scheduledAt });
    await stationActivityRepo.save([sas1, sas2]);

    // ChildStation
    const cs1 = childStationRepo.create({ childId: child1.id, stationId: stationA.id, instructorId: instructor1.id, activitySessionId: activity1.id, type: "in" as any });
    const cs2 = childStationRepo.create({ childId: child2.id, stationId: stationB.id, instructorId: instructor2.id, activitySessionId: activity2.id, type: "in" as any });
    await childStationRepo.save([cs1, cs2]);

    // Issues
    const issue1 = issueRepo.create({ description: "Criança com dificuldade respiratória durante o percurso", images: ["img1.jpg"], instructorId: instructor1.id, activitySessionId: activity1.id });
    await issueRepo.save(issue1);

    // Medical Reports (recommendations left null)
    const report1 = reportRepo.create({ childId: child1.id, healthProfessionalId: hp1.id, diagnosis: "Alergia sazonal", recommendations: null });
    await reportRepo.save(report1);

    console.log("Seeding finished.");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await dataSource.destroy();
    console.log("Data source destroyed. Done.");
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
