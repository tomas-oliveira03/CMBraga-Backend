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
import { BadgeCriteria } from "@/helpers/types";
import informationHash from "@/lib/information-hash";
import { Route } from "@/db/entities/Route";
import { RouteStation } from "@/db/entities/RouteStation";
import { ChildHistory } from "@/db/entities/ChildHistory";
import fs from "fs";
import path from "path";
import { selectRandomDefaultProfilePicture, USER_DEFAULT_PROFILE_PICTURES } from "@/helpers/storage";
import { checkImagesExist, uploadImageBuffer } from "@/server/services/cloud";
import { RouteConnection } from "@/db/entities/RouteConnection";


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
  const datafile = path.join(__dirname, "/routes/data.json");

  // Load seed JSON from disk
  let seedData: any = {};
  try {
    const raw = fs.readFileSync(datafile, "utf-8");
    seedData = JSON.parse(raw);
    console.log("Loaded seed JSON:", datafile);
  } catch (err) {
    console.warn("Could not load seed JSON, proceeding with in-script defaults:", err?.message || err);
  }
  
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
    
    // Read all route files from the cicloExpresso directory
    const routesBaseDir = path.join(__dirname, "/routes/cicloExpresso/json");
    const routeFiles = fs.readdirSync(routesBaseDir).filter(file => file.endsWith('.json'));

    console.log(`Found ${routeFiles.length} route files to process`);

    let allRoutes: Route[] = [];
    let allRouteStations: RouteStation[] = [];
    
    // Create a map to track stations by name and coordinates
    const stationMap = new Map<string, Station>();
    
    for (const routeFile of routeFiles) {
      const routeJsonPath = path.join(routesBaseDir, routeFile);
      const routeJsonData = fs.readFileSync(routeJsonPath, "utf-8");
      const routeData = JSON.parse(routeJsonData);
      
      console.log(`Processing route file: ${routeFile}`);
      
      const stations: Station[] = [];
      
      for (let i = 0; i < routeData.stops.length; i++) {
        const stop = routeData.stops[i];
        const stationKey = `${stop.lat}-${stop.lon}`;

        let station = stationMap.get(stationKey);
        
        if (!station) {
          const existingStation = await stationRepo.findOne({
            where: {
              latitude: stop.lat,
              longitude: stop.lon
            }
          });
          
          if (existingStation) {
            station = existingStation;
            console.log(`♻️  Reusing existing station from DB: ${stop.name}`);
          } else {

            station = stationRepo.create({
              name: stop.name,
              type: stop.type,
              longitude: stop.lon,
              latitude: stop.lat
            });
            await stationRepo.save(station);
            console.log(`✨ Created new station: ${stop.name}`);
          }
          
          // Add to map for future reference
          stationMap.set(stationKey, station);
        } else {
          console.log(`♻️  Reusing station from map: ${stop.name}`);
        }
        
        stations.push(station);
      }
      
      console.log(`✅ Processed ${stations.length} stations for ${routeFile}`);
      
      // 2. Create Route
      const routeName = routeFile.replace('.json', '');
      const route = routeRepo.create({
        name: routeName,
        activityType: "ciclo_expresso" as any,
        distanceMeters: Math.round(routeData.totalDistance * 1000),
        boundsNorth: routeData.bounds.north,
        boundsSouth: routeData.bounds.south,
        boundsEast: routeData.bounds.east,
        boundsWest: routeData.bounds.west,
        metadata: routeData.route
      });
      await routeRepo.save(route);
      allRoutes.push(route);
      console.log(`✅ Created route: ${route.name}`);
      
      // 3. Create RouteStations relationships
      const routeStations = routeData.stops.map((stop: any, index: number) => 
        routeStationRepo.create({
          routeId: route.id,
          stationId: stations[index]!.id,
          stopNumber: index + 1,
          distanceFromStartMeters: stop.distanceFromStart * 1000,
          distanceFromPreviousStationMeters: stop.distanceFromPrevious ? Math.round(stop.distanceFromPrevious * 1000) : 0,
          timeFromStartMinutes: stop.timeFromStartMinutes
        })
      );
      
      allRouteStations.push(...routeStations);
    }

    // Save all route-station relationships at once
    await routeStationRepo.save(allRouteStations);
    console.log(`✅ Created ${allRouteStations.length} route-station relationships for all routes`);
    console.log(`✅ Total routes created: ${allRoutes.length}`);
    console.log(`✅ Total unique stations created: ${stationMap.size}`);

    // Use the first route for the activity session
    const route = allRoutes[0]!;
    const stationsForActivity = await routeStationRepo.find({
      where: { routeId: route.id },
      order: { stopNumber: 'ASC' }
    });
    
    const stations = await Promise.all(
      stationsForActivity.map(rs => stationRepo.findOneBy({ id: rs.stationId }))
    );

    // Load the route data for the first route to get stop information
    const firstRouteFile = routeFiles[0]!;
    const firstRouteJsonPath = path.join(routesBaseDir, firstRouteFile);
    const firstRouteJsonData = fs.readFileSync(firstRouteJsonPath, "utf-8");
    const routeData = JSON.parse(firstRouteJsonData);

    // 4. Create Activity Session based on the route
    const atividade = activityRepo.create({
      type: "ciclo_expresso" as any,
      mode: "bike" as any,
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

    // Create health professionals from JSON (fallback to previous single hp if missing)
    const hpEntities: HealthProfessional[] = [];
    let hp1: HealthProfessional;
    if (Array.isArray(seedData.healthProfessionals) && seedData.healthProfessionals.length) {
      for (const hp of seedData.healthProfessionals) {
        const hpEnt = hpRepo.create({
          name: hp.name,
          email: hp.email,
          password: encryptedPassword,
          phone: hp.phone,
          specialty: hp.specialty as any,
          activatedAt: new Date(),
          profilePictureURL: selectRandomDefaultProfilePicture()
        });
        hpEntities.push(hpEnt);
      }
      await hpRepo.save(hpEntities);
      for (const hpEnt of hpEntities) {
        await userRepo.save(userRepo.create({
          id: hpEnt.email,
          name: hpEnt.name,
          healthProfessionalId: hpEnt.id,
          profilePictureURL: hpEnt.profilePictureURL
        }));
      }
      // Ensure hp1 is set for later usage (fallback to first created HP)
      hp1 = hpEntities[0]!;
    } else {
      // fallback to previous single HP if json missing
      hp1 = hpRepo.create({
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
      hpEntities.push(hp1);
    }

    // Create admins from JSON (fallback to previous single admin)
    const adminEntities: Admin[] = [];
    if (Array.isArray(seedData.admins) && seedData.admins.length) {
      for (const a of seedData.admins) {
        const adminEnt = adminRepo.create({
          name: a.name,
          email: a.email,
          password: encryptedPassword,
          phone: a.phone,
          activatedAt: new Date(),
          profilePictureURL: selectRandomDefaultProfilePicture()
        });
        adminEntities.push(adminEnt);
      }
      await adminRepo.save(adminEntities);
      for (const adminEnt of adminEntities) {
        await userRepo.save(userRepo.create({
          id: adminEnt.email,
          name: adminEnt.name,
          adminId: adminEnt.id,
          profilePictureURL: adminEnt.profilePictureURL
        }));
      }
    } else {
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
      adminEntities.push(admin);
    }
 
    // 7. Create parents from JSON
    const pais: Parent[] = [];
    if (Array.isArray(seedData.parents) && seedData.parents.length) {
      for (const p of seedData.parents) {
        const parent = parentRepo.create({
          name: p.name,
          email: p.email,
          password: encryptedPassword,
          phone: p.phone,
          address: p.address,
          activatedAt: new Date(),
          profilePictureURL: selectRandomDefaultProfilePicture()
        });
        pais.push(parent);
      }
      await parentRepo.save(pais);
      console.log(`✅ Created ${pais.length} parents (from JSON)`);
      // create corresponding user entries
      for (const parent of pais) {
        await userRepo.save(userRepo.create({
          id: parent.email,
          name: parent.name,
          parentId: parent.id,
          profilePictureURL: parent.profilePictureURL
        }));
      }
    } else {
      // fallback to synthetic parents (kept minimal)
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
      for (const parent of pais) {
        await userRepo.save(userRepo.create({
          id: parent.email,
          name: parent.name,
          parentId: parent.id,
          profilePictureURL: parent.profilePictureURL
        }));
      }
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

    // 10. Create instructors from JSON (instructores)
    const instrutores: Instructor[] = [];
    if (Array.isArray(seedData.instructores) && seedData.instructores.length) {
      for (const ins of seedData.instructores) {
        const instEnt = instructorRepo.create({
          name: ins.name,
          email: ins.email,
          password: encryptedPassword,
          phone: ins.phone,
          activatedAt: new Date(),
          profilePictureURL: selectRandomDefaultProfilePicture()
        });
        instrutores.push(instEnt);
      }
      await instructorRepo.save(instrutores);
      console.log(`✅ Created ${instrutores.length} instructors (from JSON)`);
      for (const instructor of instrutores) {
        await userRepo.save(userRepo.create({
          id: instructor.email,
          name: instructor.name,
          instructorId: instructor.id,
          profilePictureURL: instructor.profilePictureURL
        }));
      }
    } else {
      // fallback to two synthetic instructors
      const fallbackInstr = [
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
        })
      ];
      await instructorRepo.save(fallbackInstr);
      instrutores.push(...fallbackInstr);
      for (const instructor of fallbackInstr) {
        await userRepo.save(userRepo.create({
          id: instructor.email,
          name: instructor.name,
          instructorId: instructor.id,
          profilePictureURL: instructor.profilePictureURL
        }));
      }
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
          dropOffStationId: criancas[i]!.dropOffStationId,
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



    // Create RouteConnection 
    const linhaAzul = await routeRepo.findOne({ where: { name: "LinhaAzul" } });
    const linhaVermelha = await routeRepo.findOne({ where: { name: "LinhaVermelha" } });

    const mergeStop = await stationRepo.findOne({ where: { name: "Av. 31 de Janeiro" } });

    await AppDataSource.getRepository(RouteConnection).insert([
      {
        fromRouteId: linhaAzul!.id,
        toRouteId: linhaVermelha!.id,
        stationId: mergeStop!.id
      },
      {
        fromRouteId: linhaVermelha!.id,
        toRouteId: linhaAzul!.id,
        stationId: mergeStop!.id
      }
    ])




    const report1 = reportRepo.create({ 
      childId: criancas[0]!.id, 
      healthProfessionalId: hp1.id, 
      diagnosis: "Alergia sazonal", 
      recommendations: null 
    });
    await reportRepo.save(report1);

    // 15. Create badges (from seed JSON -> medals)
    let createdBadgesCount = 0;
    if (Array.isArray(seedData.medals) && seedData.medals.length) {
      // Deduplicate medals by name (case-insensitive) to avoid duplicates in the JSON
      const uniqueMap = new Map<string, any>();
      for (const m of seedData.medals) {
        const nameKey = String(m?.name || "").trim().toLowerCase();
        if (!nameKey) continue;
        if (!uniqueMap.has(nameKey)) uniqueMap.set(nameKey, m);
      }
      const uniqueMedals = Array.from(uniqueMap.values());

      const badgesToSave: Badge[] = [];
      for (const m of uniqueMedals) {
        // Skip if a badge with the same name already exists in DB
        const existing = await badgeRepo.findOne({ where: { name: m.name } });
        if (existing) continue;

        badgesToSave.push(badgeRepo.create({
          name: m.name,
          description: m.description,
          criteria: (BadgeCriteria as any)[m.criteria] || (m.criteria as any),
          valueneeded: m.valueneeded ?? 0,
          imageUrl: m.imageUrl
        }));
      }

      if (badgesToSave.length) {
        await badgeRepo.save(badgesToSave);
      }
      createdBadgesCount = badgesToSave.length;
    } else {
      // no medals in JSON - keep previous in-script badges if desired (omitted here)
      createdBadgesCount = 0;
    }

    // 16. Create feedbacks (same sample feedbacks as oldhydration)
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
    console.log("✅ 3. Criadas " + allRouteStations.length + " relações rota-estação");
    console.log("✅ 4. Criada atividade baseada na rota");
    console.log("✅ 5. Criados 10 pais e 10 crianças");
    console.log("✅ 6. Criados " + childHistories.length + " registos de histórico de crianças (3 por criança)");
    console.log("✅ 7. Criados 2 instrutores");
    console.log("✅ 8. Instrutores e crianças registados na atividade");
    console.log("✅ 9. Crianças distribuídas entre " + pickupStations.length + " estações de recolha");
    console.log("✅ 10. Todas as crianças têm drop-off na escola (última estação)");
    console.log("📍 Distância total da rota: " + route.distanceMeters + " metros");
    console.log("🏅 Criadas " + createdBadgesCount + " medalhas (from JSON)");
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