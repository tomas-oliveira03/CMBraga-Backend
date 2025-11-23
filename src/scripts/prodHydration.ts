import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import { hydrateDefaultProfilePicturesFromDB, selectRandomDefaultProfilePicture } from "@/helpers/storage";
import { createPasswordEmail } from "@/server/services/email";
import path from "path";
import fs from "fs";
import { Route } from "@/db/entities/Route";
import { RouteConnection } from "@/db/entities/RouteConnection";
import { RouteStation } from "@/db/entities/RouteStation";
import { Station } from "@/db/entities/Station";
import { ActivityType, BadgeCriteria, DefaultImageType, TypeOfChat } from "@/helpers/types";
import { uploadImageBuffer } from "@/server/services/cloud";
import { CloudDefaultImages } from "@/db/entities/CloudDefaultImages";
import { Badge } from "@/db/entities/Badge";
import { Chat } from "@/db/entities/Chat";
import { UserChat } from "@/db/entities/UserChat";
import crypto from "crypto";
import passwordHash from "@/lib/password-hash";
import { User } from "@/db/entities/User";


const ADMIN_EMAIL = "your_email@example.com"


function generateSecurePassword(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}<>?";
    const bytes = crypto.randomBytes(length);
    let password = "";

    for (let i = 0; i < length; i++) {
        const byte = bytes[i] ?? 0;
        password += chars[byte % chars.length];
    }

    return password;
}


async function databaseAlreadyHydrated(): Promise<boolean> {
    const adminCount = await AppDataSource.getRepository(Admin).count();
    return adminCount > 0;
}


export async function cloudAlreadyHydrated(): Promise<boolean> {
    const cloudImageCount = await AppDataSource.getRepository(CloudDefaultImages).count();
    return cloudImageCount > 0;
}


async function createNewAdminAccount() {
    const name = "Admin"
    const date = new Date();
    const password = generateSecurePassword(12);

    await hydrateDefaultProfilePicturesFromDB()
    
    const profilePictureURL = selectRandomDefaultProfilePicture();

    
    const admin = await AppDataSource.getRepository(Admin).insert({
        name: name,
        email: ADMIN_EMAIL,
        profilePictureURL: profilePictureURL,
        password: await passwordHash.hash(password),
        phone: "000000000",
        createdAt: date,
        activatedAt: date,
        updatedAt: date
    })

    await AppDataSource.getRepository(User).insert({
        id: ADMIN_EMAIL,
        name: name,
        profilePictureURL: profilePictureURL,
        adminId: admin.identifiers[0]!.id,
    })
    
}


export async function importRoutes() {
    const routesBaseDir = path.join(__dirname, "/data/routes");
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
        
        // Map route type string to ActivityType enum
        const activityType = routeData.type === 'ciclo_expresso' ? ActivityType.CICLO_EXPRESSO : ActivityType.PEDIBUS;
        
        const stations: Station[] = [];
        
        for (let i = 0; i < routeData.stops.length; i++) {
            const stop = routeData.stops[i];
            const stationKey = `${stop.lat}-${stop.lon}`;

            let station = stationMap.get(stationKey);
            
            if (!station) {
                const existingStation = await AppDataSource.getRepository(Station).findOne({
                    where: { latitude: stop.lat, longitude: stop.lon }
                });
                
                if (existingStation) {
                    station = existingStation;
                    console.log(`♻️  Reusing existing station: ${stop.name}`);
                } 
                else {
                    station = AppDataSource.getRepository(Station).create({
                        name: stop.name,
                        type: stop.type,
                        longitude: stop.lon,
                        latitude: stop.lat
                    });

                    await AppDataSource.getRepository(Station).insert(station);
                    console.log(`✨ Created new station: ${stop.name}`);
                }
                stationMap.set(stationKey, station);
            } 
            else {
                console.log(`♻️  Reusing station from map: ${stop.name}`);
            }
            
            stations.push(station);
        }
        
        const route = AppDataSource.getRepository(Route).create({
            name: routeData.name,
            color: routeData.color,
            activityType: activityType,
            distanceMeters: Math.round(routeData.totalDistance * 1000),
            boundsNorth: routeData.bounds.north,
            boundsSouth: routeData.bounds.south,
            boundsEast: routeData.bounds.east,
            boundsWest: routeData.bounds.west,
            metadata: routeData.route
        });
        await AppDataSource.getRepository(Route).insert(route);

        allRoutes.push(route);
        console.log(`✅ Created route: ${route.name}`);
        
        const routeStations = routeData.stops.map((stop: any, index: number) => 
            AppDataSource.getRepository(RouteStation).create({
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

    await AppDataSource.getRepository(RouteStation).insert(allRouteStations);



    // Create route connections
    const linhaAzul = allRoutes.find(r => r.name === "CX4 EB1 S. Lázaro 25/26");
    const linhaVermelha = allRoutes.find(r => r.name === "PB10 Gulbenkian 25/26");
    const mergeStop = await AppDataSource.getRepository(Station).findOne({ where: { name: "Av. 31 de Janeiro"} });

    if (linhaAzul && linhaVermelha && mergeStop) {
        await AppDataSource.getRepository(RouteConnection).insert([
            { fromRouteId: linhaAzul.id, toRouteId: linhaVermelha.id, stationId: mergeStop.id },
            { fromRouteId: linhaVermelha.id, toRouteId: linhaAzul.id, stationId: mergeStop.id }
        ]);
        console.log(`✅ Created route connections at ${mergeStop.name}`);
    }


    const linhaAmarela = allRoutes.find(r => r.name === "CX9 S. João do Souto / D. Pedro V / S. Lazaro / S. Vitor 25/26");
    const linhaAmarelaConeccao = allRoutes.find(r => r.name === "CX9 Largo Sra-A-Branca / EB1 S. Vitor 25/26");
    const mergeStop2 = await AppDataSource.getRepository(Station).findOne({ where: { name: "Largo Sra-A-Branca"} });

    if (linhaAmarela && linhaAmarelaConeccao && mergeStop2) {
        await AppDataSource.getRepository(RouteConnection).insert([
            { fromRouteId: linhaAmarela.id, toRouteId: linhaAmarelaConeccao.id, stationId: mergeStop2.id },
        ]);
        console.log(`✅ Created route connections at ${mergeStop2.name}`);
    }

}


export async function importBadges() {
    const badgesImagesData = await AppDataSource.getRepository(CloudDefaultImages).find({  
        where: { imageType: DefaultImageType.BADGES }
    });

    const badgesDataPath = path.join(__dirname, "data/images/badgesData.json");
    const badgesJsonData = fs.readFileSync(badgesDataPath, "utf-8");
    const badgesData = JSON.parse(badgesJsonData).badges;
    
    const badges: {
        name: string;
        description: string;
        imageUrl: string;
        criteria: BadgeCriteria;
        valueneeded?: number;
    }[] = [];

    const nameSet = new Set<string>();
    for(const badgeName of badgesData){
        if(nameSet.has(badgeName.name)){
            throw new Error(`Duplicate badge name found: ${badgeName.name}`);
        }
        nameSet.add(badgeName.name);
    }


    for (const badgeInfo of badgesData) {
        const matchingImage = badgesImagesData.find(img => img.fileName === badgeInfo.fileName.replace(/\s+/g, '_'));
        if (matchingImage) {
            
            badges.push({
                name: badgeInfo.name,
                description: badgeInfo.description,
                imageUrl: matchingImage.imageUrl,
                criteria: badgeInfo.criteria,
                valueneeded: badgeInfo.valueneeded
            });
        } else {
            console.warn(`⚠️  No matching image found for badge: ${badgeInfo.name}`);
        }
    }
    await AppDataSource.getRepository(Badge).insert(badges);

}


async function importChats() {
    const defaultChatImageURL = await AppDataSource.getRepository(CloudDefaultImages).findOne({
        where: { imageType: DefaultImageType.GROUPS }
    });
    const defaultPhotoURL = defaultChatImageURL ? defaultChatImageURL.imageUrl : "default-photo-url";

    const generalChat = await AppDataSource.getRepository(Chat).insert({
        chatName: "Chat Geral",
        chatType: TypeOfChat.GENERAL_CHAT,
        destinatairePhoto: defaultPhotoURL
    });

    const cicloexpressoChat = await AppDataSource.getRepository(Chat).insert({
        chatName: "Chat Ciclo Expresso",
        chatType: TypeOfChat.GENERAL_CHAT,
        destinatairePhoto: defaultPhotoURL
    });

    const pedibusChat = await AppDataSource.getRepository(Chat).insert({
        chatName: "Chat Pedibus",
        chatType: TypeOfChat.GENERAL_CHAT,
        destinatairePhoto: defaultPhotoURL
    });

    await AppDataSource.getRepository(UserChat).insert([
        {
            userId: ADMIN_EMAIL,
            chatId: generalChat.identifiers[0]!.id,
        },
        {
            userId: ADMIN_EMAIL,
            chatId: cicloexpressoChat.identifiers[0]!.id,
        },
        {
            userId: ADMIN_EMAIL,
            chatId: pedibusChat.identifiers[0]!.id,
        }
    ]);
}


export async function hydrateCloud() {
    const FOLDER = path.join(__dirname, "data/images");
    
    if (!fs.existsSync(FOLDER)) {
        console.warn("Images folder not found, skipping cloud hydration");
        return;
    }

    const folders = fs.readdirSync(FOLDER, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const foldersPermitted = [DefaultImageType.USERS, DefaultImageType.GROUPS, DefaultImageType.BADGES];
    const permittedFolders = folders.filter(folder => foldersPermitted.includes(folder as DefaultImageType));

    console.log(`Found ${permittedFolders.length} permitted image folders to process`);

    const allImagesData: { fileName: string; imageType: DefaultImageType; imageUrl: string }[] = [];
    
    for (const folderName of permittedFolders) {
        const folderPath = path.join(FOLDER, folderName);
        const imageFiles = fs.readdirSync(folderPath)
            .filter(file => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file));

        console.log(`Processing ${imageFiles.length} images in folder: ${folderName}`);

        for (const imageFile of imageFiles) {
            const filePath = path.join(folderPath, imageFile);
            const buffer = fs.readFileSync(filePath);
            const fileNameWithoutExt = path.parse(imageFile).name;

            // Upload image to cloud
            const imageUrl = await uploadImageBuffer(buffer, fileNameWithoutExt, folderName, true);
            
            allImagesData.push({ fileName: fileNameWithoutExt, imageType: folderName as DefaultImageType, imageUrl: imageUrl });
        }
    }

    await AppDataSource.getRepository(CloudDefaultImages).insert(
        allImagesData.map(data => ({
            fileName: data.fileName,
            imageType: data.imageType,
            imageUrl: data.imageUrl
        }))
    );
}



async function runHydration() {
    try {

        const checkIfDataFolderExists = fs.existsSync(path.join(__dirname, 'data'));
        if (!checkIfDataFolderExists) {
            console.error("Data folder not found. Please ensure the 'data' folder exists in the current directory.");
            process.exit(1);
        }

        await AppDataSource.initialize();

        console.log("Starting hydration process...");
        
        // Cloud hydration
        const cloudHydrated = await cloudAlreadyHydrated();
        if (cloudHydrated) {
            console.log("Cloud already hydrated. Exiting hydration script...");
        }
        else {
            await hydrateCloud();
            console.log("Cloud hydration completed successfully");
        }

        // Database hydration
        const alreadyHydrated = await databaseAlreadyHydrated();
        if (alreadyHydrated) {
            console.log("Database already hydrated. Exiting hydration script...");
        }
        else {
            await createNewAdminAccount();
            console.log("New admin account created successfully");

            await importRoutes();
            console.log("Routes imported successfully");
            
            await importBadges()
            console.log("Badges imported successfully");
            
            await importChats()
            console.log("Chats imported successfully");
        }
    }
    catch (error) {
        console.error("Error during Data Source initialization:", error);
        return;
    }
}



// runHydration().then(() => {
//     console.log("Hydration script completed.");
//     process.exit(0);
// }).catch((error) => {
//     console.error("Hydration script failed with error:", error);
//     process.exit(1);
// });


