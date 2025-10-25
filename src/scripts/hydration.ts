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
import { ChildHistory } from "@/db/entities/ChildHistory";
import fs from "fs";
import path from "path";
import { selectRandomDefaultProfilePicture, USER_DEFAULT_PROFILE_PICTURES } from "@/helpers/storage";
import { checkImagesExist, uploadImageBuffer } from "@/server/services/cloud";


async function cloudHydration(){
  console.log("Checking cloud images...");
  
  const imageExistenceResults = await checkImagesExist(USER_DEFAULT_PROFILE_PICTURES);
  
  const missingImages = USER_DEFAULT_PROFILE_PICTURES.filter(url => !imageExistenceResults[url]);
  
  if (missingImages.length === 0) {
    console.log("✅ All default profile pictures exist in cloud");
    return;
  }
  
  console.log(`⚠️ Found ${missingImages.length} missing images in cloud, uploading...`);
  
  for (const missingUrl of missingImages) {
    try {
      const filename = missingUrl.split('/').pop();
      if (!filename) {
        console.error(`❌ Could not extract filename from URL: ${missingUrl}`);
        continue;
      }
      
      const imagePath = path.join(__dirname, "cloud_images", filename);
      
      if (!fs.existsSync(imagePath)) {
        console.error(`❌ Local image file not found: ${imagePath}`);
        continue;
      }
      
      const imageBuffer = fs.readFileSync(imagePath);
      const filenameWithoutExt = filename.split('.')[0] || filename; 
      
      await uploadImageBuffer(imageBuffer, filenameWithoutExt, "users", true);
      console.log(`✅ Uploaded ${filename} to cloud`);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${missingUrl}:`, error);
    }
  }
  
  console.log("Cloud hydration completed");
}

async function dbHydration() {
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
    const childHistoryRepo = dataSource.getRepository(ChildHistory);

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
      childHistoryRepo,
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
      // Use type from JSON directly
      const station = stationRepo.create({
        name: stop.name,
        type: stop.type, // <-- use type from JSON
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
      activityType: "pedibus" as any,
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
        distanceFromPreviousStationMeters: stop.distanceFromPrevious ? Math.round(stop.distanceFromPrevious * 1000) : 0,
        timeFromStartMinutes: stop.timeFromStartMinutes // <-- use timeFromStartMinutes from JSON
      })
    );
    await routeStationRepo.save(routeStations);
    console.log(`✅ Created ${routeStations.length} route-station relationships`);

    // 4. Create Activity Session based on the route
    const atividade = activityRepo.create({
      type: "pedibus" as any,
      mode: "walk" as any,
      scheduledAt: new Date(),
      routeId: route.id,
    });
    await activityRepo.save(atividade);
    console.log(`✅ Created activity session: ${atividade.id}`);

    // 5. Create station-activity sessions (from route stations)
    const stationActivitySessions = [];
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < stations.length; i++) {
      const stop = routeData.stops[i];
      stationActivitySessions.push(
        stationActivityRepo.create({
          stationId: stations[i]!.id,
          activitySessionId: atividade.id,
          stopNumber: i + 1,
          // Use timeFromStartMinutes to calculate scheduled time
          scheduledAt: new Date(yesterday.getTime() + (stop.timeFromStartMinutes * 60 * 1000)),
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
      activatedAt: new Date(),
      profilePictureURL: selectRandomDefaultProfilePicture()
    });
    await hpRepo.save(hp1);

    await userRepo.save(userRepo.create({
      id: hp1.email,
      name: hp1.name,
      healthProfessionalId: hp1.id,
      profilePictureURL: hp1.profilePictureURL
    }));

    const admin = adminRepo.create({ 
      name: "Admin User", 
      email: "admin@cmbraga.pt", 
      password: encryptedPassword,
      phone: "900000000",
      activatedAt: new Date(),
      profilePictureURL: selectRandomDefaultProfilePicture()
    });
    await adminRepo.save(admin);

    await userRepo.save(userRepo.create({
      id: admin.email,
      name: admin.name,
      adminId: admin.id,
      profilePictureURL: admin.profilePictureURL
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
        activatedAt: new Date(),
        profilePictureURL: selectRandomDefaultProfilePicture()
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
        profilePictureURL: parent.profilePictureURL
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
        dateOfBirth: new Date(`2015-0${(i % 9) + 1}-15`),
        heightCentimeters: 120 + (i * 3), // Heights from 120cm to 147cm
        weightKilograms: 25 + (i * 2), // Weights from 25kg to 43kg
        profilePictureURL: selectRandomDefaultProfilePicture()
      });
      criancas.push(child);
    }
    await childRepo.save(criancas);
    console.log(`✅ Created ${criancas.length} children`);

    // 8.1. Create child history records (tracking growth over time)
    const childHistories: ChildHistory[] = [];
    const currentDate = new Date();
    
    for (const child of criancas) {
      // Calculate age from date of birth
      const birthDate = new Date(child.dateOfBirth);
      const age = currentDate.getFullYear() - birthDate.getFullYear();
      
      // Create 3 historical records for each child (simulating measurements over 6 months)
      // 6 months ago
      childHistories.push(
        childHistoryRepo.create({
          childId: child.id,
          heightCentimeters: child.heightCentimeters - 6,
          weightKilograms: child.weightKilograms - 3,
          age: age - 1,
          createdAt: new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000)
        })
      );
      
      // 3 months ago
      childHistories.push(
        childHistoryRepo.create({
          childId: child.id,
          heightCentimeters: child.heightCentimeters - 3,
          weightKilograms: child.weightKilograms - 1,
          age: age,
          createdAt: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000)
        })
      );
      
      // Current measurements
      childHistories.push(
        childHistoryRepo.create({
          childId: child.id,
          heightCentimeters: child.heightCentimeters,
          weightKilograms: child.weightKilograms,
          age: age,
          createdAt: currentDate
        })
      );
    }
    
    await childHistoryRepo.save(childHistories);
    console.log(`✅ Created ${childHistories.length} child history records (${childHistories.length / criancas.length} per child)`);

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
        activatedAt: new Date(),
        profilePictureURL: selectRandomDefaultProfilePicture()
      }),
      instructorRepo.create({ 
        name: "Instrutor 2", 
        email: "inst2@cmbraga.pt", 
        password: encryptedPassword, 
        phone: "922222222",
        activatedAt: new Date(),
        profilePictureURL: selectRandomDefaultProfilePicture()
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
        profilePictureURL: instructor.profilePictureURL
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
      imageURLs: USER_DEFAULT_PROFILE_PICTURES, 
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
    const calories1 = badgeRepo.create({
      name: "Centelha Calórica",
      description: "Premiado por queimar 100 calorias.",
      criteria: BadgeCriteria.CALORIES,
      valueneeded: 100,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Calories1.png"
    })

    const calories2 = badgeRepo.create({
      name: "Queimador Urbano",
      description: "Premiado por queimar 500 calorias.",
      criteria: BadgeCriteria.CALORIES,
      valueneeded: 500,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Calories2.png"
    })

    const calories3 = badgeRepo.create({
      name: "Titã das Calorias",
      description: "Premiado por queimar 1000 calorias.",
      criteria: BadgeCriteria.CALORIES,
      valueneeded: 1000,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Calories3.png"
    })
    const calories4 = badgeRepo.create({
      name: "Força Incansável",
      description: "Premiado por queimar 5000 calorias.",
      criteria: BadgeCriteria.CALORIES,
      valueneeded: 5000,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Calories4.png"
    })

    const calories5 = badgeRepo.create({
      name: "Devastador de Calorias",
      description: "Premiado por queimar 10000 calorias.",
      criteria: BadgeCriteria.CALORIES,
      valueneeded: 10000,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Calories5.png"
    })

    const distance1 = badgeRepo.create({
      name: "Passo Inicial",
      description: "Premiado por percorrer 1 km.",
      criteria: BadgeCriteria.DISTANCE,
      valueneeded: 1,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Distance1.png"
    })

    const distance2 = badgeRepo.create({
      name: "Caminho Alegre",
      description: "Premiado por percorrer 5 km.",
      criteria: BadgeCriteria.DISTANCE,
      valueneeded: 5,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Distance2.png"
    })

    const distance3 = badgeRepo.create({
      name: "Explorador de Trilhas",
      description: "Premiado por percorrer 10 km.",
      criteria: BadgeCriteria.DISTANCE,
      valueneeded: 10,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Distance3.png"
    })

    const distance4 = badgeRepo.create({
      name: "Aventureiro das Distâncias",
      description: "Premiado por percorrer 20 km.",
      criteria: BadgeCriteria.DISTANCE,
      valueneeded: 20,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Distance4.png"
    })

    const distance5 = badgeRepo.create({
      name: "Navegador de Longas",
      description: "Premiado por percorrer 50 km.",
      criteria: BadgeCriteria.DISTANCE,
      valueneeded: 50,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Distance5.png"
    })
    
    const leaderboard1 = badgeRepo.create({
      name: "Top Dez Distintos",
      description: "Premiado por estar entre os 10 primeiros em distância.",
      criteria: BadgeCriteria.LEADERBOARD,
      valueneeded: 10,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Leaderboard1.png"
    })
    const leaderboard2 = badgeRepo.create({
      name: "Elite dos Cinco",
      description: "Premiado por estar entre os 5 primeiros em distância.",
      criteria: BadgeCriteria.LEADERBOARD,
      valueneeded: 5,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Leaderboard2.png"
    })

    const leaderboard3 = badgeRepo.create({
      name: "Número Um Supremo",
      description: "Premiado por ser o 1º classificado em distância.",
      criteria: BadgeCriteria.LEADERBOARD,
      valueneeded: 1,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Leaderboard3.png"
    })
    const leaderboard4 = badgeRepo.create({
      name: "Tricampeão da Rua",
      description: "Premiado por ser o 1º classificado em distância por 3 vezes.",
      criteria: BadgeCriteria.LEADERBOARD,
      valueneeded: 3,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Leaderboard4.png"
    })
    
    const leaderboard5 = badgeRepo.create({
      name: "Penta Vanguardista",
      description: "Premiado por ser o 1º classificado em distância por 5 vezes.",
      criteria: BadgeCriteria.LEADERBOARD,
      valueneeded: 5,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Leaderboard5.png"
    })
    
    const participation1 = badgeRepo.create({
      name: "Participante Promissor",
      description: "Premiado por participar em 3 atividades.",
      criteria: BadgeCriteria.PARTICIPATION,
      valueneeded: 3,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Participation1.png"
    })

    const participation2 = badgeRepo.create({
      name: "Entusiasta Constante",
      description: "Premiado por participar em 5 atividades.",
      criteria: BadgeCriteria.PARTICIPATION,
      valueneeded: 5,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Participation2.png"
    })
    
    const participation3 = badgeRepo.create({
      name: "Assíduo Notável",
      description: "Premiado por participar em 10 atividades.",
      criteria: BadgeCriteria.PARTICIPATION,
      valueneeded: 10,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Participation3.png"
    })

    const participation4 = badgeRepo.create({
      name: "Veterano do Passeio",
      description: "Premiado por participar em 20 atividades.",
      criteria: BadgeCriteria.PARTICIPATION,
      valueneeded: 20,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Participation4.png"
    })

    const participation5 = badgeRepo.create({
      name: "Mestre da Participação",
      description: "Premiado por participar em 50 atividades.",
      criteria: BadgeCriteria.PARTICIPATION,
      valueneeded: 50,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Participation5.png"
    })

    const points1 = badgeRepo.create({
      name: "Contador Iniciante",
      description: "Premiado por acumular 100 pontos.",
      criteria: BadgeCriteria.POINTS,
      valueneeded: 100,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Points1.png"
    })

    const points2 = badgeRepo.create({
      name: "Acumulador Sagaz",
      description: "Premiado por acumular 500 pontos.",
      criteria: BadgeCriteria.POINTS,
      valueneeded: 500,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Points2.png"
    })

    const points3 = badgeRepo.create({
      name: "Pontual Vanguardista",
      description: "Premiado por acumular 1000 pontos.",
      criteria: BadgeCriteria.POINTS,
      valueneeded: 1000,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Points3.png"
    })

    const points4 = badgeRepo.create({
      name: "Especialista em Pontos",
      description: "Premiado por acumular 5000 pontos.",
      criteria: BadgeCriteria.POINTS,
      valueneeded: 5000,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Points4.png"
    })

    const points5 = badgeRepo.create({
      name: "Lendário dos Pontos",
      description: "Premiado por acumular 10000 pontos.",
      criteria: BadgeCriteria.POINTS,
      valueneeded: 10000,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Points5.png"
    })

    const special1 = badgeRepo.create({
      name: "Pequeno Valente",
      description: "Premiado por uma ação especial",
      criteria: BadgeCriteria.SPECIAL,
      valueneeded: 0,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Special1.png"
    })

    const special2 = badgeRepo.create({
      name: "Gratidão Brilhante",
      description: "Premiado por participar de forma especial",
      criteria: BadgeCriteria.SPECIAL,
      valueneeded: 0,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Special2.png"
    })

    const special3 = badgeRepo.create({
      name: "Aplauso Especial",
      description: "Premiado por participar de forma especial",
      criteria: BadgeCriteria.SPECIAL,
      valueneeded: 0,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Special3.png"
    })

    const special4 = badgeRepo.create({
      name: "Campeão Singular",
      description: "Premiado por uma ação especial",
      criteria: BadgeCriteria.SPECIAL,
      valueneeded: 0,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Special4.png"
    })

    const special5 = badgeRepo.create({
      name: "Herói Eterno",
      description: "Premiado por uma ação lendária",
      criteria: BadgeCriteria.SPECIAL,
      valueneeded: 0,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Special5.png"
    })

    const streak1 = badgeRepo.create({
      name: "Chama Inicial",
      description: "Premiado por completar 1 atividade consecutiva.",
      criteria: BadgeCriteria.STREAK,
      valueneeded: 1,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Streak1.png"
    })
    const streak2 = badgeRepo.create({
      name: "Fogo de Três",
      description: "Premiado por completar 3 atividades consecutivas.",
      criteria: BadgeCriteria.STREAK,
      valueneeded: 3,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Streak2.png"
    })

    const streak3 = badgeRepo.create({
      name: "Chama Persistente",
      description: "Premiado por completar 5 atividades consecutivas.",
      criteria: BadgeCriteria.STREAK,
      valueneeded: 5,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Streak3.png"
    })

    const streak4 = badgeRepo.create({
      name: "Fagulha Duradoura",
      description: "Premiado por completar 10 atividades consecutivas.",
      criteria: BadgeCriteria.STREAK,
      valueneeded: 10,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Streak4.png"
    })

    const streak5 = badgeRepo.create({
      name: "Força Incandescente",
      description: "Premiado por completar 25 atividades consecutivas.",
      criteria: BadgeCriteria.STREAK,
      valueneeded: 25,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Streak5.png"
    })
    
    const weather1 = badgeRepo.create({
      name: "Clima Amigo",
      description: "Premiado por completar 1 atividade num clima diferente.",
      criteria: BadgeCriteria.WEATHER,
      valueneeded: 1,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Weather1.png"
    })

    const weather2 = badgeRepo.create({
      name: "Viajante do Tempo",
      description: "Premiado por completar 2 atividades em climas diferentes.",
      criteria: BadgeCriteria.WEATHER,
      valueneeded: 2,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Weather2.png"
    })
    const weather3 = badgeRepo.create({
      name: "Aventureiro Climático",
      description: "Premiado por completar 3 atividades em climas diferentes.",
      criteria: BadgeCriteria.WEATHER,
      valueneeded: 3,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Weather3.png"
    })

    const weather4 = badgeRepo.create({
      name: "Explorador Atmosférico",
      description: "Premiado por completar 4 atividades em climas diferentes.",
      criteria: BadgeCriteria.WEATHER,
      valueneeded: 4,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Weather4.png"
    })

    const weather5 = badgeRepo.create({
      name: "Dominador do Tempo",
      description: "Premiado por completar 5 atividades em climas diferentes.",
      criteria: BadgeCriteria.WEATHER,
      valueneeded: 5,
      imageUrl: "https://res.cloudinary.com/dwffdkytm/image/upload/v1761084977/CMBraga/badges/Weather5.png"
    })

    const badges = [calories1, calories2, calories3, calories4, calories5,
      distance1, distance2, distance3, distance4, distance5,
      leaderboard1, leaderboard2, leaderboard3, leaderboard4, leaderboard5,
      participation1, participation2, participation3, participation4, participation5,
      points1, points2, points3, points4, points5,
      special1, special2, special3, special4, special5,
      streak1, streak2, streak3, streak4, streak5,
      weather1, weather2, weather3, weather4, weather5
    ];

    await badgeRepo.save(badges);

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
    console.log("✅ 6. Criados " + childHistories.length + " registos de histórico de crianças (3 por criança)");
    console.log("✅ 7. Criados 2 instrutores");
    console.log("✅ 8. Instrutores e crianças registados na atividade");
    console.log("✅ 9. Crianças distribuídas entre " + pickupStations.length + " estações de recolha");
    console.log("✅ 10. Todas as crianças têm drop-off na escola (última estação)");
    console.log("📍 Distância total da rota: " + route.distanceMeters + " metros");
    console.log("🏅 Criadas 8 medalhas");
    console.log("💬 Criados 5 feedbacks de pais sobre a atividade");
    console.log("📊 Cada criança tem 3 registos de crescimento (6 meses, 3 meses e atual)");

    console.log("Seeding finished.");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await dataSource.destroy();
    console.log("Data source destroyed. Done.");
  }
}


async function seed() {
  await cloudHydration();
  await dbHydration();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
