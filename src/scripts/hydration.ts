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
import { User } from "@/db/entities/User";
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
    const userRepo = dataSource.getRepository(User);

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
      userRepo,
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

    console.log("Inserindo dados de teste para rota /stop...");
    
    const encryptedPassword = informationHash.encrypt("Person23!");

    // 5 postos
    const postos = [
      stationRepo.create({ name: "Estação Central", type: "regular" as any }),
      stationRepo.create({ name: "Parque Municipal", type: "regular" as any }),
      stationRepo.create({ name: "Biblioteca", type: "regular" as any }),
      stationRepo.create({ name: "Centro Comercial", type: "regular" as any }),
      stationRepo.create({ name: "Escola Básica", type: "school" as any }),
    ];
    await stationRepo.save(postos);

    // Create health professional first
    const hp1 = hpRepo.create({ 
      name: "Dra. Marta Ramos", 
      email: "marta.ramos@saude.pt", 
      password: encryptedPassword, 
      specialty: "pediatrician" as any,
      activatedAt: new Date()
    });
    await hpRepo.save(hp1);

    // Create corresponding User for health professional
    await userRepo.save(userRepo.create({
      id: hp1.email,
      name: hp1.name,
      healthProfessionalId: hp1.id
    }));

    const admin = adminRepo.create({ 
      name: "Admin User", 
      email: "admin@cmbraga.pt", 
      password: encryptedPassword,
      activatedAt: new Date()
    });
    await adminRepo.save(admin);

    // Create corresponding User for admin
    await userRepo.save(userRepo.create({
      id: admin.email,
      name: admin.name,
      adminId: admin.id
    }));

    // 10 pais e 10 crianças
    const pais: Parent[] = [];
    const criancas: Child[] = [];
    
    for (let i = 1; i <= 10; i++) {
      const parent = parentRepo.create({
        name: `Pai ${i}`,
        email: `pai${i}@exemplo.com`,
        password: encryptedPassword,
        phone: `91${String(i).padStart(7, '0')}`,
        address: `Rua ${i}, Nº ${i}`,
        activatedAt: new Date()
      });
      pais.push(parent);
    }
    await parentRepo.save(pais);

    // Create corresponding Users for parents
    for (const parent of pais) {
      await userRepo.save(userRepo.create({
        id: parent.email,
        name: parent.name,
        parentId: parent.id,
      }));
    }

    for (let i = 0; i < 10; i++) {
      const child = childRepo.create({
        name: `Criança ${i + 1}`,
        gender: i % 2 === 0 ? "male" as any : "female" as any,
        school: "Escola Básica",
        schoolGrade: (i % 6) + 1,
        dropOffStationId: postos[4]!.id,
        dateOfBirth: new Date(`2015-0${(i % 9) + 1}-15`)
      });
      criancas.push(child);
    }
    await childRepo.save(criancas);

    // Relacionamento pai-filho
    const parentChildAssociations = criancas.map((c, i) =>
      parentChildRepo.create({ parentId: pais[i]!.id, childId: c.id })
    );
    await parentChildRepo.save(parentChildAssociations);

    // Instrutores
    const instrutores = [
      instructorRepo.create({ 
        name: "Instrutor 1", 
        email: "inst1@cmbraga.pt", 
        password: encryptedPassword, 
        phone: "911111111",
        activatedAt: new Date()
      }),
      instructorRepo.create({ 
        name: "Instrutor 2", 
        email: "inst2@cmbraga.pt", 
        password: encryptedPassword, 
        phone: "922222222",
        activatedAt: new Date()
      }),
    ];
    await instructorRepo.save(instrutores);

    // Create corresponding Users for instructors
    for (const instructor of instrutores) {
      await userRepo.save(userRepo.create({
        id: instructor.email,
        name: instructor.name,
        instructorId: instructor.id
      }));
    }

    // Atividade principal
    const atividade = activityRepo.create({
      type: "pedibus" as any,
      mode: "walk" as any,
      scheduledAt: new Date("2024-04-01T08:00:00.000Z"),
      startedAt: new Date("2024-04-01T08:05:00.000Z"),
      startedById: instrutores[0]!.id
    });
    await activityRepo.save(atividade);

    // Instrutores na atividade
    await instructorActivityRepo.save([
      instructorActivityRepo.create({ instructorId: instrutores[0]!.id, activitySessionId: atividade.id }),
      instructorActivityRepo.create({ instructorId: instrutores[1]!.id, activitySessionId: atividade.id }),
    ]);

    // 5 paradas na atividade
    const paradas = [];
    for (let i = 0; i < 5; i++) {
      paradas.push(
        stationActivityRepo.create({
          stationId: postos[i]!.id,
          activitySessionId: atividade.id,
          stopNumber: i + 1,
          scheduledAt: new Date(`2024-04-01T08:${String(10 + i * 10).padStart(2, '0')}:00.000Z`),
          arrivedAt: i < 2 ? new Date(`2024-04-01T08:${String(12 + i * 10).padStart(2, '0')}:00.000Z`) : null // primeiras 2 já visitadas
        })
      );
    }
    await stationActivityRepo.save(paradas);

    // Distribuir 10 crianças entre os 5 postos (2 por posto)
    const childActivityRegistrations = [];
    for (let i = 0; i < criancas.length; i++) {
      const postoIndex = Math.floor(i / 2);
      childActivityRegistrations.push(
        childActivityRepo.create({
          childId: criancas[i]!.id,
          activitySessionId: atividade.id,
          pickUpStationId: postos[postoIndex]!.id,
          parentId: pais[i]!.id,
          isLateRegistration: false
        })
      );
    }
    await childActivityRepo.save(childActivityRegistrations);

    // Check-in das crianças dos 2 primeiros postos (4 crianças)
    const childStationRecords = [];
    for (let i = 0; i < 4; i++) {
      const postoIndex = Math.floor(i / 2);
      childStationRecords.push(
        childStationRepo.create({
          childId: criancas[i]!.id,
          stationId: postos[postoIndex]!.id,
          instructorId: instrutores[0]!.id,
          activitySessionId: atividade.id,
          type: "in" as any,
          registeredAt: new Date(`2024-04-01T08:${String(12 + postoIndex * 10).padStart(2, '0')}:00.000Z`)
        })
      );
    }
    await childStationRepo.save(childStationRecords);

    // Um dos 4 já saiu (para testar childrenOut)
    await childStationRepo.save(childStationRepo.create({
      childId: criancas[3]!.id,
      stationId: postos[1]!.id,
      instructorId: instrutores[1]!.id,
      activitySessionId: atividade.id,
      type: "out" as any,
      registeredAt: new Date("2024-04-01T08:23:00.000Z")
    }));

    // Issues
    const issue1 = issueRepo.create({ 
      description: "Criança com dificuldade respiratória durante o percurso", 
      images: ["img1.jpg"], 
      instructorId: instrutores[0]!.id, 
      activitySessionId: atividade.id 
    });
    await issueRepo.save(issue1);

    // Medical Reports
    const report1 = reportRepo.create({ 
      childId: criancas[0]!.id, 
      healthProfessionalId: hp1.id, 
      diagnosis: "Alergia sazonal", 
      recommendations: null 
    });
    await reportRepo.save(report1);

    console.log("\n=== HIDRATAÇÃO COMPLETA ===");
    console.log("✅ Criados 5 postos e 10 crianças (2 por posto)");
    console.log("✅ Criados registros de usuário para Admin, Instrutores, Pais e Profissional de Saúde");
    console.log("🚌 Atividade iniciada, postos 1 e 2 já visitados");
    console.log("📍 Próximo posto: Biblioteca (posto 3)");

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
