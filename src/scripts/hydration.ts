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
import { Feedback } from "@/db/entities/Feedback";
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
    const feedbackRepo = dataSource.getRepository(Feedback);

    console.log("Cleaning tables (dependents first)...");
    // Clear repositories in order, but ignore errors if the table doesn't exist yet
    const reposToClear = [
      childActivityRepo,
      instructorActivityRepo,
      stationActivityRepo,
      childStationRepo,
      issueRepo,
      reportRepo,
      feedbackRepo,
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

    console.log("Creating route and stations from mock_route.json...");
    
    // Read route data from JSON
    const routeJsonPath = path.join(__dirname, "mock_route.json");
    const routeJsonData = fs.readFileSync(routeJsonPath, "utf-8");
    const routeData = JSON.parse(routeJsonData);

    // 1. Create stations from route stops FIRST
    const stations: Station[] = [];
    
    for (let i = 0; i < routeData.stops.length; i++) {
      const stop = routeData.stops[i];
      const isLastStop = i === routeData.stops.length - 1;
      
      const station = stationRepo.create({
        name: stop.name,
        type: isLastStop ? StationType.SCHOOL : StationType.REGULAR,
        longitude: stop.lon,
        latitude: stop.lat
      });
      stations.push(station);
    }
    await stationRepo.save(stations);
    console.log(`✅ Created ${stations.length} stations`);

    // 2. Create Route
    const route = routeRepo.create({
      name: "Rota Pedibus Centro",
      distanceMeters: Math.round(routeData.totalDistance * 1000), // Convert km to meters
      boundsNorth: routeData.bounds.north,
      boundsSouth: routeData.bounds.south,
      boundsEast: routeData.bounds.east,
      boundsWest: routeData.bounds.west,
      metadata: routeData.route
    });
    await routeRepo.save(route);
    console.log(`✅ Created route: ${route.name}`);

    // 3. Create RouteStations relationships
    const routeStations = routeData.stops.map((stop: any, index: number) => 
      routeStationRepo.create({
        routeId: route.id,
        stationId: stations[index]!.id,
        stopNumber: index + 1,
        distanceFromStartMeters: stop.distanceFromStart * 1000, // Convert km to meters
        distanceFromPreviousStationMeters: stop.distanceFromPrevious ? Math.round(stop.distanceFromPrevious * 1000) : 0
      })
    );
    await routeStationRepo.save(routeStations);
    console.log(`✅ Created ${routeStations.length} route-station relationships`);

    // 4. Create Activity Session based on the route
    const atividade = activityRepo.create({
      type: "pedibus" as any,
      mode: "walk" as any,
      scheduledAt: createLisbonDate(),
      routeId: route.id,
    });
    await activityRepo.save(atividade);
    console.log(`✅ Created activity session: ${atividade.id}`);

    // 5. Create station-activity sessions (from route stations)
    const stationActivitySessions = [];
    const now = createLisbonDate();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < stations.length; i++) {
      stationActivitySessions.push(
        stationActivityRepo.create({
          stationId: stations[i]!.id,
          activitySessionId: atividade.id,
          stopNumber: i + 1,
          scheduledAt: new Date(yesterday.getTime() + (20 + i * 5) * 60 * 1000),
        })
      );
    }
    await stationActivityRepo.save(stationActivitySessions);
    console.log(`✅ Created ${stationActivitySessions.length} station-activity sessions`);

    // 6. Create health professional and admin
    const encryptedPassword = informationHash.encrypt("Person23!");

    const hp1 = hpRepo.create({ 
      name: "Dra. Marta Ramos", 
      email: "marta.ramos@saude.pt", 
      password: encryptedPassword, 
      phone: "912345678",
      specialty: "pediatrician" as any,
      activatedAt: createLisbonDate(),
      profilePictureURL: "https://res.cloudinary.com/dwffdkytm/image/upload/v1760796584/default-profile-pic1_qxz6rf.jpg"
    });
    await hpRepo.save(hp1);

    await userRepo.save(userRepo.create({
      id: hp1.email,
      name: hp1.name,
      healthProfessionalId: hp1.id,
    }));

    const admin = adminRepo.create({ 
      name: "Admin User", 
      email: "admin@cmbraga.pt", 
      password: encryptedPassword,
      phone: "900000000",
      activatedAt: createLisbonDate(),
      profilePictureURL: "https://res.cloudinary.com/dwffdkytm/image/upload/v1760796584/default-profile-pic1_qxz6rf.jpg"
    });
    await adminRepo.save(admin);

    await userRepo.save(userRepo.create({
      id: admin.email,
      name: admin.name,
      adminId: admin.id,
    }));

    // 7. Create parents
    const pais: Parent[] = [];
    
    for (let i = 1; i <= 10; i++) {
      const parent = parentRepo.create({
        name: `Pai ${i}`,
        email: `pai${i}@exemplo.com`,
        password: encryptedPassword,
        phone: `91${String(i).padStart(7, '0')}`,
        address: `Rua ${i}, Nº ${i}`,
        activatedAt: createLisbonDate(),
        profilePictureURL: "https://res.cloudinary.com/dwffdkytm/image/upload/v1760796584/default-profile-pic1_qxz6rf.jpg"
      });
      pais.push(parent);
    }
    await parentRepo.save(pais);
    console.log(`✅ Created ${pais.length} parents`);

    // Create corresponding Users for parents
    for (const parent of pais) {
      await userRepo.save(userRepo.create({
        id: parent.email,
        name: parent.name,
        parentId: parent.id,
      }));
    }

    // 8. Create children with drop-off at school station (last station)
    const criancas: Child[] = [];
    const schoolStation = stations[stations.length - 1]; // Last station is school

    for (let i = 0; i < 10; i++) {
      const child = childRepo.create({
        name: `Criança ${i + 1}`,
        gender: i % 2 === 0 ? "male" as any : "female" as any,
        school: "Escola Básica",
        schoolGrade: (i % 6) + 1,
        dropOffStationId: schoolStation!.id,
        dateOfBirth: createLisbonDate(`2015-0${(i % 9) + 1}-15`),
        profilePictureURL: "https://res.cloudinary.com/dwffdkytm/image/upload/v1760796584/default-profile-pic1_qxz6rf.jpg"
      });
      criancas.push(child);
    }
    await childRepo.save(criancas);
    console.log(`✅ Created ${criancas.length} children`);

    // 9. Create parent-child relationships
    const parentChildAssociations = criancas.map((c, i) =>
      parentChildRepo.create({ parentId: pais[i]!.id, childId: c.id })
    );
    await parentChildRepo.save(parentChildAssociations);
    console.log(`✅ Created ${parentChildAssociations.length} parent-child associations`);

    // 10. Create instructors
    const instrutores = [
      instructorRepo.create({ 
        name: "Instrutor 1", 
        email: "inst1@cmbraga.pt", 
        password: encryptedPassword, 
        phone: "911111111",
        activatedAt: createLisbonDate(),
        profilePictureURL: "https://res.cloudinary.com/dwffdkytm/image/upload/v1760796584/default-profile-pic1_qxz6rf.jpg"
      }),
      instructorRepo.create({ 
        name: "Instrutor 2", 
        email: "inst2@cmbraga.pt", 
        password: encryptedPassword, 
        phone: "922222222",
        activatedAt: createLisbonDate(),
        profilePictureURL: "https://res.cloudinary.com/dwffdkytm/image/upload/v1760796584/default-profile-pic1_qxz6rf.jpg"
      }),
    ];
    await instructorRepo.save(instrutores);
    console.log(`✅ Created ${instrutores.length} instructors`);

    // Create corresponding Users for instructors
    for (const instructor of instrutores) {
      await userRepo.save(userRepo.create({
        id: instructor.email,
        name: instructor.name,
        instructorId: instructor.id,
      }));
    }

    // 11. Assign instructors to the activity
    await instructorActivityRepo.save([
      instructorActivityRepo.create({ instructorId: instrutores[0]!.id, activitySessionId: atividade.id }),
      instructorActivityRepo.create({ instructorId: instrutores[1]!.id, activitySessionId: atividade.id }),
    ]);
    console.log(`✅ Assigned instructors to activity session`);

    // 12. Register children to the activity (distributed among pickup stations, excluding school)
    const pickupStations = stations.slice(0, -1); // All stations except the last one (school)
    const childActivityRegistrations = [];
    
    for (let i = 0; i < criancas.length; i++) {
      const pickupStationIndex = i % pickupStations.length;
      childActivityRegistrations.push(
        childActivityRepo.create({
          childId: criancas[i]!.id,
          activitySessionId: atividade.id,
          pickUpStationId: pickupStations[pickupStationIndex]!.id,
          parentId: pais[i]!.id,
          isLateRegistration: false,
          registeredAt: yesterday
        })
      );
    }
    await childActivityRepo.save(childActivityRegistrations);
    console.log(`✅ Registered ${childActivityRegistrations.length} children to activity session`);

    // 13. Register first parent to activity session
    const parentActivityRegistration = parentActivityRepo.create({
      parentId: pais[0]!.id,
      activitySessionId: atividade.id,
      registeredAt: yesterday
    });
    await parentActivityRepo.save(parentActivityRegistration);

    // 14. Create sample issues and medical reports
    const issue1 = issueRepo.create({ 
      description: "Criança com dificuldade respiratória durante o percurso", 
      imageURLs: ["img1.jpg"], 
      instructorId: instrutores[0]!.id, 
      activitySessionId: atividade.id 
    });
    await issueRepo.save(issue1);

    const report1 = reportRepo.create({ 
      childId: criancas[0]!.id, 
      healthProfessionalId: hp1.id, 
      diagnosis: "Alergia sazonal", 
      recommendations: null 
    });
    await reportRepo.save(report1);

    // 15. Create badges
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

    // 16. Create feedbacks
    const feedback1 = feedbackRepo.create({
      evaluation1: 5,
      evaluation2: 5,
      evaluation3: 4,
      evaluation4: 5,
      evaluation5: 5,
      textFeedback: "Excelente atividade! O meu filho adorou a experiência e chegou a casa muito entusiasmado.",
      overallRating: 5,
      activitySessionId: atividade.id,
      childId: criancas[0]!.id,
      parentId: pais[0]!.id,
      submitedAt: new Date("2024-04-01T20:00:00.000Z")
    });

    const feedback2 = feedbackRepo.create({
      evaluation1: 4,
      evaluation2: 4,
      evaluation3: 5,
      evaluation4: 4,
      evaluation5: 4,
      textFeedback: "Muito boa organização. Os instrutores foram muito atenciosos e cuidadosos.",
      overallRating: 4,
      activitySessionId: atividade.id,
      childId: criancas[1]!.id,
      parentId: pais[1]!.id,
      submitedAt: new Date("2024-04-01T20:30:00.000Z")
    });

    const feedback3 = feedbackRepo.create({
      evaluation1: 5,
      evaluation2: 4,
      evaluation3: 4,
      evaluation4: 5,
      evaluation5: 5,
      textFeedback: "Ótima iniciativa! A criança fez exercício e ainda aprendeu sobre a cidade.",
      overallRating: 5,
      activitySessionId: atividade.id,
      childId: criancas[2]!.id,
      parentId: pais[2]!.id,
      submitedAt: new Date("2024-04-01T21:00:00.000Z")
    });

    const feedback4 = feedbackRepo.create({
      evaluation1: 3,
      evaluation2: 4,
      evaluation3: 3,
      evaluation4: 4,
      evaluation5: 3,
      textFeedback: "Foi bom, mas o percurso podia ser um pouco mais curto para crianças mais novas.",
      overallRating: 3,
      activitySessionId: atividade.id,
      childId: criancas[3]!.id,
      parentId: pais[3]!.id,
      submitedAt: new Date("2024-04-01T21:30:00.000Z")
    });

    const feedback5 = feedbackRepo.create({
      evaluation1: 5,
      evaluation2: 5,
      evaluation3: 5,
      evaluation4: 5,
      evaluation5: 5,
      textFeedback: "Perfeito! Seguro, divertido e educativo. Recomendo a todos os pais!",
      overallRating: 5,
      activitySessionId: atividade.id,
      childId: criancas[4]!.id,
      parentId: pais[4]!.id,
      submitedAt: new Date("2024-04-02T08:00:00.000Z")
    });

    await feedbackRepo.save([feedback1, feedback2, feedback3, feedback4, feedback5]);

    console.log("\n=== HIDRATAÇÃO COMPLETA ===");
    console.log("✅ 1. Criadas " + stations.length + " estações a partir do ficheiro JSON");
    console.log("✅ 2. Criada rota '" + route.name + "' com " + stations.length + " estações");
    console.log("✅ 3. Criadas " + routeStations.length + " relações rota-estação");
    console.log("✅ 4. Criada atividade baseada na rota");
    console.log("✅ 5. Criados 10 pais e 10 crianças");
    console.log("✅ 6. Criados 2 instrutores");
    console.log("✅ 7. Instrutores e crianças registados na atividade");
    console.log("✅ 8. Crianças distribuídas entre " + pickupStations.length + " estações de recolha");
    console.log("✅ 9. Todas as crianças têm drop-off na escola (última estação)");
    console.log("📍 Distância total da rota: " + route.distanceMeters + " metros");
    console.log("🏅 Criadas 8 medalhas");
    console.log("💬 Criados 5 feedbacks de pais sobre a atividade");

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
