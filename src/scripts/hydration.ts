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
import { ParentActivitySession } from "@/db/entities/ParentActivitySession";
import { Badge } from "@/db/entities/Badge";
import { BadgeCriteria, StationType } from "@/helpers/types";
import informationHash from "@/lib/information-hash";
import { Route } from "@/db/entities/Route";
import { RouteStation } from "@/db/entities/RouteStation";
import fs from "fs";
import path from "path";

// Helper function to create dates in Lisbon timezone
function createLisbonDate(dateString?: string): Date {
  const date = dateString ? new Date(dateString) : new Date();
  // Convert to Lisbon timezone (UTC+1 or UTC+2 depending on daylight saving)
  const lisbonOffset = -date.getTimezoneOffset() + 60; // Assuming UTC+1 for simplicity
  return new Date(date.getTime() + (lisbonOffset * 60 * 1000));
}

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
    const parentActivityRepo = dataSource.getRepository(ParentActivitySession);
    const badgeRepo = dataSource.getRepository(Badge);
    const routeRepo = dataSource.getRepository(Route);
    const routeStationRepo = dataSource.getRepository(RouteStation);

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
      activityRepo,
      adminRepo,
      parentActivityRepo,
      badgeRepo,
      routeStationRepo,
      stationRepo,
      routeRepo,
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

    // Read route data from JSON
    const routeJsonPath = path.join(__dirname, "mock_route.json");
    const routeJsonData = fs.readFileSync(routeJsonPath, "utf-8");
    const routeData = JSON.parse(routeJsonData);

    // Create stations from route stops
    const postos: Station[] = [];
    
    for (let i = 0; i < routeData.stops.length; i++) {
      const stop = routeData.stops[i];
      const isLastStop = i === routeData.stops.length - 1;
      
      const station = stationRepo.create({
        name: stop.name,
        type: isLastStop ? StationType.SCHOOL : StationType.REGULAR,
        longitude: stop.lon,
        latitude: stop.lat
      });
      postos.push(station);
    }
    await stationRepo.save(postos);

    // Create Route
    const route = routeRepo.create({
      name: "Rota Pedibus Centro",
      distanceMeters: 3,
      boundsNorth: routeData.bounds.north,
      boundsSouth: routeData.bounds.south,
      boundsEast: routeData.bounds.east,
      boundsWest: routeData.bounds.west,
      metadata: routeData.route
    });
    await routeRepo.save(route);

    // Create RouteStations
    const routeStations = routeData.stops.map((stop: any, index: number) => 
      routeStationRepo.create({
        routeId: route.id,
        stationId: postos[index]!.id,
        stopNumber: index + 1,
        distanceFromStartMeters: 1,
        distanceFromPreviousStationMeters: 1
      })
    );
    await routeStationRepo.save(routeStations);

    // Create health professional first
    const hp1 = hpRepo.create({ 
      name: "Dra. Marta Ramos", 
      email: "marta.ramos@saude.pt", 
      password: encryptedPassword, 
      specialty: "pediatrician" as any,
      activatedAt: createLisbonDate()
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
      activatedAt: createLisbonDate()
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
        activatedAt: createLisbonDate()
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
        dropOffStationId: postos[postos.length - 1]!.id, // Last station (school)
        dateOfBirth: createLisbonDate(`2015-0${(i % 9) + 1}-15`)
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
        activatedAt: createLisbonDate()
      }),
      instructorRepo.create({ 
        name: "Instrutor 2", 
        email: "inst2@cmbraga.pt", 
        password: encryptedPassword, 
        phone: "922222222",
        activatedAt: createLisbonDate()
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
      scheduledAt: createLisbonDate(),
      routeId: route.id,
    });
    await activityRepo.save(atividade);

    // Instrutores na atividade
    await instructorActivityRepo.save([
      instructorActivityRepo.create({ instructorId: instrutores[0]!.id, activitySessionId: atividade.id }),
      instructorActivityRepo.create({ instructorId: instrutores[1]!.id, activitySessionId: atividade.id }),
    ]);

    // paradas na atividade (from route stations)
    const paradas = [];
    const now = createLisbonDate();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < postos.length; i++) {
      paradas.push(
        stationActivityRepo.create({
          stationId: postos[i]!.id,
          activitySessionId: atividade.id,
          stopNumber: i + 1,
          scheduledAt: new Date(yesterday.getTime() + (20 + i * 5) * 60 * 1000),
        })
      );
    }
    await stationActivityRepo.save(paradas);

    // Distribuir 10 crianças entre os postos (equally distributed)
    const childActivityRegistrations = [];
    for (let i = 0; i < criancas.length; i++) {
      const postoIndex = Math.floor(i / Math.ceil(criancas.length / (postos.length - 1))) % (postos.length - 1);
      childActivityRegistrations.push(
        childActivityRepo.create({
          childId: criancas[i]!.id,
          activitySessionId: atividade.id,
          pickUpStationId: postos[postoIndex]!.id,
          parentId: pais[i]!.id,
          isLateRegistration: false,
          registeredAt: yesterday
        })
      );
    }
    await childActivityRepo.save(childActivityRegistrations);

    // Add parent to activity session - register the first parent for the activity
    const parentActivityRegistration = parentActivityRepo.create({
      parentId: pais[0]!.id,
      activitySessionId: atividade.id,
      registeredAt: yesterday
    });
    await parentActivityRepo.save(parentActivityRegistration);

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

    const badge1 = badgeRepo.create({
      name: "Primeira Participação",
      description: "Concluiu a primeira participação com sucesso!",
      imageUrl: "https://example.com/images/badge1.png",
      criteria: BadgeCriteria.PARTICIPATION,
      valueneeded: 1
    });

    const badge2 = badgeRepo.create({
      name: "Explorador Urbano",
      description: "Concluiu 5 caminhadas consecutivas.",
      imageUrl: "https://example.com/images/badge2.png",
      criteria: BadgeCriteria.STREAK,
      valueneeded: 5
    });

    const badge3 = badgeRepo.create({
      name: "Cidadão Ativo",
      description: "Percorreu 20 km no total.",
      imageUrl: "https://example.com/images/badge3.png",
      criteria: BadgeCriteria.DISTANCE,
      valueneeded: 20
    });

    const badge4 = badgeRepo.create({
      name: "Queimador de Calorias",
      description: "Queimou 2000 calorias no total.",
      imageUrl: "https://example.com/images/badge4.png",
      criteria: BadgeCriteria.CALORIES,
      valueneeded: 2000
    });

    const badge5 = badgeRepo.create({
      name: "Amante do Clima",
      description: "Participou em atividades sob diferentes condições climáticas.",
      imageUrl: "https://example.com/images/badge5.png",
      criteria: BadgeCriteria.WEATHER,
      valueneeded: 3
    });

    const badge6 = badgeRepo.create({
      name: "Pontuador",
      description: "Acumulou 1000 pontos de atividade.",
      imageUrl: "https://example.com/images/badge6.png",
      criteria: BadgeCriteria.POINTS,
      valueneeded: 1000
    });

    const badge7 = badgeRepo.create({
      name: "Top do Ranking",
      description: "Alcançou o top 1 no quadro de líderes mensal.",
      imageUrl: "https://example.com/images/badge7.png",
      criteria: BadgeCriteria.LEADERBOARD,
      valueneeded: 1
    });

    const badge8 = badgeRepo.create({
      name: "Participante Solidário",
      description: "Foi solidário.",
      imageUrl: "https://example.com/images/badge8.png",
      criteria: BadgeCriteria.SPECIAL,
      valueneeded: 1
    });


    await badgeRepo.save([badge1, badge2, badge3, badge4, badge5, badge6, badge7, badge8]);


    console.log("\n=== HIDRATAÇÃO COMPLETA ===");
    console.log("✅ Criados " + postos.length + " postos a partir do ficheiro JSON");
    console.log("✅ Criada 1 rota com " + postos.length + " estações");
    console.log("✅ Criadas 10 crianças (distribuídas entre os postos)");
    console.log("✅ Criados registros de usuário para Admin, Instrutores, Pais e Profissional de Saúde");
    console.log("🚌 Atividade iniciada com a rota importada");
    console.log("📍 Total de distância da rota: " + routeData.totalDistance + " metros");
    console.log("🏅 Criadas 8 medalhas");

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
