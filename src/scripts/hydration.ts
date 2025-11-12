import "reflect-metadata";
import { AppDataSource } from "@/db";
import { Station } from "@/db/entities/Station";
import { Parent } from "@/db/entities/Parent";
import { Child } from "@/db/entities/Child";
import { ParentChild } from "@/db/entities/ParentChild";
import { Instructor } from "@/db/entities/Instructor";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { Admin } from "@/db/entities/Admin";
import { Notification } from "@/db/entities/Notification";
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
import { BadgeCriteria, UserNotificationType } from "@/helpers/types";
import informationHash from "@/lib/information-hash";
import { Route } from "@/db/entities/Route";
import { RouteStation } from "@/db/entities/RouteStation";
import { ChildHistory } from "@/db/entities/ChildHistory";
import fs from "fs";
import path from "path";
import { selectRandomDefaultProfilePicture, USER_DEFAULT_PROFILE_PICTURES } from "@/helpers/storage";
import { checkImagesExist, uploadImageBuffer } from "@/server/services/cloud";
import { RouteConnection } from "@/db/entities/RouteConnection";
import redisClient from "@/lib/redis";
import { Chat } from "@/db/entities/Chat";
import { UserChat } from "@/db/entities/UserChat";
import { Message } from "@/db/entities/Message";
import { TypeOfChat } from "@/helpers/types";


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
  
  // Clear Redis cache
  console.log("Flushing Redis cache...");
  try {
    await redisClient.initialize();
    await redisClient.flushAll();
    console.log("✅ Redis cache cleared");
  } catch (error) {
    console.warn("⚠️  Failed to flush Redis:", error instanceof Error ? error.message : String(error));
  }

  const datafile = path.join(__dirname, "/routes/data.json");

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
    const chatRepo = dataSource.getRepository(Chat);
    const userChatRepo = dataSource.getRepository(UserChat);
    const messageRepo = dataSource.getRepository(Message);

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
      messageRepo,
      userChatRepo,
      chatRepo,
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

    console.log("Creating routes and stations...");
    
    const routesBaseDir = path.join(__dirname, "/routes/cicloExpresso/json");
    const routeFiles = fs.readdirSync(routesBaseDir).filter(file => file.endsWith('.json'));

    console.log(`Found ${routeFiles.length} route files to process`);

    let allRoutes: Route[] = [];
    let allRouteStations: RouteStation[] = [];
    const stationMap = new Map<string, Station>();
    
    // Process all routes
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
            where: { latitude: stop.lat, longitude: stop.lon }
          });
          
          if (existingStation) {
            station = existingStation;
            console.log(`♻️  Reusing existing station: ${stop.name}`);
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
          
          stationMap.set(stationKey, station);
        } else {
          console.log(`♻️  Reusing station from map: ${stop.name}`);
        }
        
        stations.push(station);
      }
      
      const route = routeRepo.create({
        name: routeData.name,
        color: routeData.color,
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

    await routeStationRepo.save(allRouteStations);
    console.log(`✅ Created ${allRouteStations.length} route-station relationships`);
    console.log(`✅ Total routes: ${allRoutes.length}, Total stations: ${stationMap.size}`);

    // Create route connections
    const linhaAzul = allRoutes.find(r => r.name === "Linha Azul");
    const linhaVermelha = allRoutes.find(r => r.name === "Linha Vermelha");
    const mergeStop = await stationRepo.findOne({ where: { name: "Av. 31 de Janeiro" } });

    if (linhaAzul && linhaVermelha && mergeStop) {
      await AppDataSource.getRepository(RouteConnection).insert([
        { fromRouteId: linhaAzul.id, toRouteId: linhaVermelha.id, stationId: mergeStop.id },
        { fromRouteId: linhaVermelha.id, toRouteId: linhaAzul.id, stationId: mergeStop.id }
      ]);
      console.log(`✅ Created route connections at ${mergeStop.name}`);
    }

    // Create users (admins, instructors, parents, health professionals)
    const encryptedPassword = informationHash.encrypt("Person23!");

    const hpEntities: HealthProfessional[] = [];
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
    }

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
    }

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
      for (const parent of pais) {
        await userRepo.save(userRepo.create({
          id: parent.email,
          name: parent.name,
          parentId: parent.id,
          profilePictureURL: parent.profilePictureURL
        }));
      }
    }

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
      for (const instructor of instrutores) {
        await userRepo.save(userRepo.create({
          id: instructor.email,
          name: instructor.name,
          instructorId: instructor.id,
          profilePictureURL: instructor.profilePictureURL
        }));
      }
    }

    console.log(`✅ Created ${hpEntities.length} health professionals, ${adminEntities.length} admins, ${pais.length} parents, ${instrutores.length} instructors`);

    // Create general chat and add all users
    console.log("Creating general chat...");
    const generalChat = await chatRepo.save({
      chatName: "Chat Geral",
      chatType: TypeOfChat.GENERAL_CHAT,
      destinatairePhoto: "default-photo-url"
    });

    const allUserEmails = [
      ...adminEntities.map(a => a.email),
      ...instrutores.map(i => i.email),
      ...pais.map(p => p.email),
      ...hpEntities.map(hp => hp.email)
    ];

    const userChatEntries = allUserEmails.map(email => ({
      userId: email,
      chatId: generalChat.id
    }));

    await userChatRepo.insert(userChatEntries);
    console.log(`✅ Created general chat with ${allUserEmails.length} users`);

    // Create sample messages in general chat
    const sampleMessages = [
      { sender: allUserEmails[0], content: "Bem-vindos ao chat geral da plataforma!" },
      { sender: allUserEmails[1], content: "Olá a todos! 👋" },
      { sender: allUserEmails[2], content: "Boa tarde! Prontos para as atividades?" }
    ];

    for (const msg of sampleMessages) {
      if (msg.sender) {
        const user = await userRepo.findOne({ where: { id: msg.sender } });
        if (user) {
          await messageRepo.insert({
            content: informationHash.encrypt(msg.content),
            timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000), // Random time within last 2 hours
            chatId: generalChat.id,
            senderId: msg.sender,
          });
        }
      }
    }
    console.log(`✅ Created ${sampleMessages.length} sample messages in general chat`);

    // Create children (20 children for variety)
    const criancas: Child[] = [];
    const allStations = Array.from(stationMap.values());
    const schoolStations = allStations.filter(s => s.type === "school");
    
    for (let i = 0; i < 3; i++) {
      const schoolStation = schoolStations[i % schoolStations.length] || allStations[allStations.length - 1];
      const child = childRepo.create({
        name: `Criança ${i + 1}`,
        gender: i % 2 === 0 ? "male" as any : "female" as any,
        school: `Escola ${schoolStation!.name}`,
        schoolGrade: (i % 6) + 1,
        dropOffStationId: schoolStation!.id,
        dateOfBirth: new Date(`201${5 + (i % 4)}-0${(i % 9) + 1}-${10 + (i % 15)}`),
        heightCentimeters: 110 + (i * 2),
        weightKilograms: 20 + i,
        profilePictureURL: selectRandomDefaultProfilePicture()
      });
      criancas.push(child);
    }
    await childRepo.save(criancas);

    // Create child history
    const childHistories: ChildHistory[] = [];
    const currentDate = new Date();
    for (const child of criancas) {
      const birthDate = new Date(child.dateOfBirth);
      const age = currentDate.getFullYear() - birthDate.getFullYear();
      
      childHistories.push(
        childHistoryRepo.create({
          childId: child.id,
          heightCentimeters: child.heightCentimeters - 6,
          weightKilograms: child.weightKilograms - 3,
          age: age - 1,
          createdAt: new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000)
        }),
        childHistoryRepo.create({
          childId: child.id,
          heightCentimeters: child.heightCentimeters - 3,
          weightKilograms: child.weightKilograms - 1,
          age: age,
          createdAt: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000)
        }),
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

    // Create parent-child relationships
    const parentChildAssociations = criancas.map((c, i) =>
      parentChildRepo.create({ parentId: pais[i % pais.length]!.id, childId: c.id })
    );
    await parentChildRepo.save(parentChildAssociations);
    console.log(`✅ Created ${criancas.length} children with history and parent associations`);

    // ===== CREATE COMPREHENSIVE ACTIVITY SCENARIOS =====
    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    
    // Helper to create consistent station activity sessions
    async function createStationActivitySessions(
      activityId: string,
      routeId: string,
      baseTime: Date
    ) {
      const routeStations = await routeStationRepo.find({
        where: { routeId },
        order: { stopNumber: 'ASC' }
      });
      
      const sessions = routeStations.map(rs =>
        stationActivityRepo.create({
          stationId: rs.stationId,
          activitySessionId: activityId,
          stopNumber: rs.stopNumber,
          scheduledAt: new Date(baseTime.getTime() + (rs.timeFromStartMinutes * 60 * 1000))
        })
      );
      
      await stationActivityRepo.save(sessions);
      return sessions;
    }

    // SCENARIO 1: Future activity WITHOUT transfer (Linha Azul)
    const futureActivity1 = activityRepo.create({
      type: "ciclo_expresso" as any,
      mode: "bike" as any,
      scheduledAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      routeId: linhaAzul!.id,
      inLateRegistration: false
    });
    await activityRepo.save(futureActivity1);
    await createStationActivitySessions(futureActivity1.id, linhaAzul!.id, futureActivity1.scheduledAt);
    await instructorActivityRepo.save([
      instructorActivityRepo.create({ instructorId: instrutores[0]!.id, activitySessionId: futureActivity1.id }),
      instructorActivityRepo.create({ instructorId: instrutores[1]!.id, activitySessionId: futureActivity1.id })
    ]);
    
    // Get valid stations for LinhaAzul
    const linhaAzulStations = await routeStationRepo.find({ 
      where: { routeId: linhaAzul!.id },
      order: { stopNumber: 'ASC' },
      relations:{
        station: true
      }
    });
    
    // Register children using valid route stations
    for (let i = 0; i < Math.min(2, criancas.length); i++) {
      const child = criancas[i]!;
      const pickupStation = linhaAzulStations[i % linhaAzulStations.length];
      const dropoffStation = linhaAzulStations[(i + 2) % linhaAzulStations.length]; // Different station for dropoff
      
      await childActivityRepo.save(childActivityRepo.create({
        childId: child.id,
        activitySessionId: futureActivity1.id,
        pickUpStationId: pickupStation!.stationId,
        dropOffStationId: dropoffStation!.stationId,
        isLateRegistration: false,
        parentId: pais[i % pais.length]!.id,
        registeredAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000)
      }));
    }

    // SCENARIO 2: Future activity WITH transfer (Linha Azul -> Linha Vermelha)
    const futureActivity2a = activityRepo.create({
      type: "ciclo_expresso" as any,
      mode: "bike" as any,
      scheduledAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now, 8:00 AM
      routeId: linhaAzul!.id,
      inLateRegistration: false
    });
    await activityRepo.save(futureActivity2a);
    
    const futureActivity2b = activityRepo.create({
      type: "ciclo_expresso" as any,
      mode: "bike" as any,
      scheduledAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // Same day, 30 min offset
      routeId: linhaVermelha!.id,
      inLateRegistration: false
    });
    await activityRepo.save(futureActivity2b);
    
    // Link activities (transfer)
    futureActivity2a.activityTransferId = futureActivity2b.id;
    await activityRepo.save(futureActivity2a);
    
    await createStationActivitySessions(futureActivity2a.id, linhaAzul!.id, futureActivity2a.scheduledAt);
    await createStationActivitySessions(futureActivity2b.id, linhaVermelha!.id, futureActivity2b.scheduledAt);
    
    await instructorActivityRepo.save([
      instructorActivityRepo.create({ instructorId: instrutores[0]!.id, activitySessionId: futureActivity2a.id }),
      instructorActivityRepo.create({ instructorId: instrutores[1]!.id, activitySessionId: futureActivity2b.id })
    ]);
    
    // Register 3 children with transfer
    const transferChildCount = Math.min(2, criancas.length - 1);
    for (let i = 1; i < 1 + transferChildCount; i++) {
      const child = criancas[i]!;
      const pickupStation = linhaAzulStations[0]!.stationId;
      
      // Get valid stations for LinhaVermelha
      const linhaVermelhaStations = await routeStationRepo.find({ 
        where: { routeId: linhaVermelha!.id },
        order: { stopNumber: 'DESC' }
      });
      const finalDropoff = linhaVermelhaStations[0]!.stationId;
      
      await childActivityRepo.save([
        childActivityRepo.create({
          childId: child.id,
          activitySessionId: futureActivity2a.id,
          pickUpStationId: pickupStation,
          dropOffStationId: mergeStop!.id,
          isLateRegistration: false,
          parentId: pais[i % pais.length]!.id,
          registeredAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          chainedActivitySessionId: futureActivity2a.id
        }),
        childActivityRepo.create({
          childId: child.id,
          activitySessionId: futureActivity2b.id,
          pickUpStationId: mergeStop!.id,
          dropOffStationId: finalDropoff,
          isLateRegistration: false,
          parentId: pais[i % pais.length]!.id,
          registeredAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          chainedActivitySessionId: futureActivity2a.id
        })
      ]);
    }

    // SCENARIO 3: Ongoing activity (started 30 min ago, not finished)
    const ongoingActivity = activityRepo.create({
      type: "ciclo_expresso" as any,
      mode: "bike" as any,
      scheduledAt: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 min ago
      routeId: linhaAzul!.id,
      inLateRegistration: false,
      startedAt: new Date(now.getTime() - 30 * 60 * 1000),
      startedById: instrutores[0]!.id
    });
    await activityRepo.save(ongoingActivity);
    await createStationActivitySessions(ongoingActivity.id, linhaAzul!.id, ongoingActivity.scheduledAt);
    await instructorActivityRepo.save(
      instructorActivityRepo.create({ instructorId: instrutores[0]!.id, activitySessionId: ongoingActivity.id })
    );
    
    // Register and check-in children for ongoing activity
    for (let i = 0; i < Math.min(1, criancas.length); i++) {
      const child = criancas[i]!;
      const pickupStation = linhaAzulStations[i % linhaAzulStations.length];
      const dropoffStation = linhaAzulStations[(i + 3) % linhaAzulStations.length];
      
      await childActivityRepo.save(childActivityRepo.create({
        childId: child.id,
        activitySessionId: ongoingActivity.id,
        pickUpStationId: pickupStation!.stationId,
        dropOffStationId: dropoffStation!.stationId,
        isLateRegistration: false,
        parentId: pais[i % pais.length]!.id,
        registeredAt: new Date(ongoingActivity.scheduledAt.getTime() - 24 * 60 * 60 * 1000)
      }));
      
      // Check-in at pickup station
      await childStationRepo.save(childStationRepo.create({
        childId: child.id,
        stationId: pickupStation!.stationId,
        activitySessionId: ongoingActivity.id,
        type: "in" as any,
        instructorId: instrutores[0]!.id,
        registeredAt: new Date(now.getTime() - 20 * 60 * 1000)
      }));
    }

    // SCENARIO 4: Finished activity (completed yesterday)
    const finishedActivity = activityRepo.create({
      type: "ciclo_expresso" as any,
      mode: "bike" as any,
      scheduledAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000), // Yesterday 8:00 AM
      routeId: linhaVermelha!.id,
      inLateRegistration: false,
      startedAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
      startedById: instrutores[1]!.id,
      finishedAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5h later
      finishedById: instrutores[1]!.id
    });
    await activityRepo.save(finishedActivity);
    
    // Create station activity sessions with realistic arrival/departure times for finished activity
    const finishedRouteStations = await routeStationRepo.find({
      where: { routeId: linhaVermelha!.id },
      order: { stopNumber: 'ASC' }
    });
    
    const finishedStationSessions = [];
    for (const rs of finishedRouteStations) {
      const scheduledTime = new Date(finishedActivity.scheduledAt.getTime() + (rs.timeFromStartMinutes * 60 * 1000));
      
      // Add some realistic delays (1-3 minutes behind schedule)
      const delayMinutes = Math.floor(Math.random() * 3) + 1;
      const arrivedAt = new Date(scheduledTime.getTime() + delayMinutes * 60 * 1000);
      
      // Stay at station for 2-5 minutes
      const stayDuration = (Math.floor(Math.random() * 4) + 2) * 60 * 1000;
      const leftAt = new Date(arrivedAt.getTime() + stayDuration);
      
      const session = stationActivityRepo.create({
        stationId: rs.stationId,
        activitySessionId: finishedActivity.id,
        stopNumber: rs.stopNumber,
        scheduledAt: scheduledTime,
        arrivedAt: arrivedAt,
        leftAt: leftAt
      });
      
      finishedStationSessions.push(session);
    }
    
    await stationActivityRepo.save(finishedStationSessions);
    
    await instructorActivityRepo.save(
      instructorActivityRepo.create({ instructorId: instrutores[1]!.id, activitySessionId: finishedActivity.id })
    );
    
    // Get valid stations for LinhaVermelha
    const linhaVermelhaStations = await routeStationRepo.find({ 
      where: { routeId: linhaVermelha!.id },
      order: { stopNumber: 'ASC' }
    });
    
    // Register children with full check-in/out for finished activity
    for (let i = 0; i < Math.min(2, criancas.length); i++) {
      const child = criancas[i]!;
      const pickupStation = linhaVermelhaStations[0];
      const dropoffStation = linhaVermelhaStations[linhaVermelhaStations.length - 1];
      
      await childActivityRepo.save(childActivityRepo.create({
        childId: child.id,
        activitySessionId: finishedActivity.id,
        pickUpStationId: pickupStation!.stationId,
        dropOffStationId: dropoffStation!.stationId,
        isLateRegistration: false,
        parentId: pais[i % pais.length]!.id,
        registeredAt: new Date(finishedActivity.scheduledAt.getTime() - 48 * 60 * 60 * 1000)
      }));
      
      // Check-in
      await childStationRepo.save(childStationRepo.create({
        childId: child.id,
        stationId: pickupStation!.stationId,
        activitySessionId: finishedActivity.id,
        type: "in" as any,
        instructorId: instrutores[1]!.id,
        registeredAt: new Date(finishedActivity.startedAt!.getTime() + 5 * 60 * 1000)
      }));
      
      // Check-out
      await childStationRepo.save(childStationRepo.create({
        childId: child.id,
        stationId: dropoffStation!.stationId,
        activitySessionId: finishedActivity.id,
        type: "out" as any,
        instructorId: instrutores[1]!.id,
        registeredAt: new Date(finishedActivity.finishedAt!.getTime() - 10 * 60 * 1000)
      }));
    }
    

    // SCENARIO 5: Future activity in late registration
    const lateRegActivity = activityRepo.create({
      type: "ciclo_expresso" as any,
      mode: "bike" as any,
      scheduledAt: new Date(baseDate.getTime() + 12 * 60 * 60 * 1000), // Today at 8:00 PM (12h from now)
      routeId: linhaAzul!.id,
      inLateRegistration: true
    });
    await activityRepo.save(lateRegActivity);
    await createStationActivitySessions(lateRegActivity.id, linhaAzul!.id, lateRegActivity.scheduledAt);
    await instructorActivityRepo.save(
      instructorActivityRepo.create({ instructorId: instrutores[0]!.id, activitySessionId: lateRegActivity.id })
    );
    
    // Register children for late registration activity
    const lateRegChildren = [];
    if (criancas.length >= 2) {
      const dropoffStation1 = linhaAzulStations[(linhaAzulStations.length - 2) % linhaAzulStations.length];
      lateRegChildren.push(
        childActivityRepo.create({
          childId: criancas[1]!.id,
          activitySessionId: lateRegActivity.id,
          pickUpStationId: linhaAzulStations[0]!.stationId,
          dropOffStationId: dropoffStation1!.stationId,
          isLateRegistration: false,
          parentId: pais[1 % pais.length]!.id,
          registeredAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000)
        })
      );
    }
    if (criancas.length >= 3) {
      const dropoffStation2 = linhaAzulStations[linhaAzulStations.length - 1];
      lateRegChildren.push(
        childActivityRepo.create({
          childId: criancas[2]!.id,
          activitySessionId: lateRegActivity.id,
          pickUpStationId: linhaAzulStations[1]!.stationId,
          dropOffStationId: dropoffStation2!.stationId,
          isLateRegistration: true,
          parentId: pais[2 % pais.length]!.id,
          registeredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2h ago
        })
      );
    }
    if (lateRegChildren.length > 0) {
      await childActivityRepo.save(lateRegChildren);
    }

    // Create sample issue
    await issueRepo.save(issueRepo.create({
      description: "Criança com dificuldade respiratória durante o percurso",
      imageURLs: USER_DEFAULT_PROFILE_PICTURES,
      instructorId: instrutores[0]!.id,
      activitySessionId: finishedActivity.id
    }));

    // Create medical report
    if (hpEntities.length > 0) {
      await reportRepo.save(reportRepo.create({
        childId: criancas[0]!.id,
        healthProfessionalId: hpEntities[0]!.id,
        diagnosis: "Alergia sazonal",
        recommendations: "Evitar exposição a pólen"
      }));
    }

    // Create badges from JSON
    let createdBadgesCount = 0;
    if (Array.isArray(seedData.medals) && seedData.medals.length) {
      const uniqueMap = new Map<string, any>();
      for (const m of seedData.medals) {
        const nameKey = String(m?.name || "").trim().toLowerCase();
        if (!nameKey) continue;
        if (!uniqueMap.has(nameKey)) uniqueMap.set(nameKey, m);
      }
      const uniqueMedals = Array.from(uniqueMap.values());

      const badgesToSave: Badge[] = [];
      for (const m of uniqueMedals) {
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
    }

    // ===== CREATE SAMPLE NOTIFICATIONS =====
    console.log("Creating sample notifications...");
    const notificationRepo = dataSource.getRepository(Notification);
    
    const sampleNotifications = [
      notificationRepo.create({
        userId: pais[0]!.email,
        type: UserNotificationType.CHILD_CHECKED_IN,
        title: "Criança entrou na atividade",
        description: `A criança ${criancas[0]!.name} entrou na estação ${linhaAzulStations[0]!.station.name} na atividade ciclo_expresso.`,
        uri: `/activity-session/${finishedActivity.id}`,
        isRead: false
      }),
      notificationRepo.create({
        userId: pais[0]!.email,
        type: UserNotificationType.CHILD_CHECKED_OUT,
        title: "Criança saiu da atividade",
        description: `A criança ${criancas[0]!.name} saiu na estação ${criancas[0]!.school}.`,
        uri: `/activity-session/${finishedActivity.id}`,
        isRead: true
      }),

      notificationRepo.create({
        userId: pais[0]!.email,
        type: UserNotificationType.CHILD_MEDICAL_REPORT,
        title: "Relatório médico da criança",
        description: `A criança ${criancas[0]!.name} possui um novo relatório médico.`,
        uri: `/child/${criancas[0]!.id}/medical-reports`,
        isRead: false
      }),

      notificationRepo.create({
        userId: instrutores[0]!.email,
        type: UserNotificationType.INSTRUCTOR_ASSIGNED_TO_ACTIVITY,
        title: "Atribuição de nova atividade",
        description: `Foi-lhe atribuído a atividade ciclo_expresso, ${linhaAzul!.name} agendada para ${futureActivity1.scheduledAt.toLocaleString('pt-PT')}.`,
        uri: `/activity-session/${futureActivity1.id}`,
        isRead: false
      }),

      ...adminEntities.map(admin => 
        notificationRepo.create({
          userId: admin.email,
          type: UserNotificationType.NEW_ACTIVITY_ISSUE,
          title: "Novo problema reportado na atividade",
          description: `Foi reportado um novo problema na atividade ciclo_expresso, ${linhaVermelha!.name} agendada para ${finishedActivity.scheduledAt.toLocaleString('pt-PT')}.`,
          uri: `/activity-session/${finishedActivity.id}/issues`,
          isRead: admin === adminEntities[0] ? true : false
        })
      )
    ];

    await notificationRepo.save(sampleNotifications);
    console.log(`✅ Created ${sampleNotifications.length} sample notifications (${adminEntities.length} admin issue notifications + 8 other types)`);

    console.log("\n=== 🎉 HIDRATAÇÃO COMPLETA ===");
    console.log(`✅ Rotas: ${allRoutes.length}`);
    console.log(`✅ Estações únicas: ${stationMap.size}`);
    console.log(`✅ Relações rota-estação: ${allRouteStations.length}`);
    console.log(`✅ Utilizadores: ${hpEntities.length} HP, ${adminEntities.length} admins, ${pais.length} parents, ${instrutores.length} instructors`);
    console.log(`✅ Crianças: ${criancas.length} (com ${childHistories.length} registos de histórico)`);
    console.log(`💬 Chat geral: ${allUserEmails.length} utilizadores + ${sampleMessages.length} mensagens`);
    console.log(`\n📅 ATIVIDADES CRIADAS:`);
    console.log(`   1️⃣  Futura SEM transbordo (daqui a 2 dias) - ${Math.min(2, criancas.length)} crianças registadas`);
    console.log(`   2️⃣  Futura COM transbordo (daqui a 3 dias) - ${Math.min(2, Math.max(0, criancas.length - 1))} crianças com transbordo`);
    console.log(`   3️⃣  Em curso (iniciada há 30 min) - ${Math.min(1, criancas.length)} crianças com check-in`);
    console.log(`   4️⃣  Finalizada (ontem) - ${Math.min(2, criancas.length)} crianças com check-in/out completo`);
    console.log(`   5️⃣  Futura em inscrição tardia (hoje à noite) - ${lateRegChildren.length} crianças`);
    console.log(`\n🏅 Badges: ${createdBadgesCount}`);
    console.log(`💬 Feedbacks: 3 (atividade finalizada)`);
    console.log(`⚠️  Issues: 1`);
    console.log(`🏥 Medical Reports: 1`);
    console.log(`📬 Notificações: ${sampleNotifications.length} (todas as 5 categorias)`);

    console.log("\n✅ Seeding finished with comprehensive, consistent data!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await dataSource.destroy();
    await redisClient.quit();
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
