import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import { selectRandomDefaultProfilePicture } from "@/helpers/storage";
import { createPasswordEmail } from "@/server/services/email";
import path from "path";
import fs from "fs";
import { Route } from "@/db/entities/Route";
import { RouteConnection } from "@/db/entities/RouteConnection";
import { RouteStation } from "@/db/entities/RouteStation";
import { Station } from "@/db/entities/Station";
import { ActivityType } from "@/helpers/types";

async function databaseAlreadyHydrated(): Promise<boolean> {
    const adminCount = await AppDataSource.getRepository(Admin).count();
    return adminCount > 0;
}

async function createNewAdminAccount(email: string) {
    try {
        const name = "Admin";

        await AppDataSource.getRepository(Admin).insert({
            name: name,
            email: email,
            profilePictureURL: selectRandomDefaultProfilePicture(),
            phone: "000000000",
        })

        await createPasswordEmail(email, name);
    }
    catch (error) {
        console.error("Error creating admin account:", error);
    }
}

async function importRoutes() {
    try {
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
                activityType: ActivityType.CICLO_EXPRESSO,
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

        console.log(`✅ Created ${allRouteStations.length} route-station relationships`);
        console.log(`✅ Total routes: ${allRoutes.length}, Total stations: ${stationMap.size}`);

        // Create route connections
        const linhaAzul = allRoutes.find(r => r.name === "Linha Azul");
        const linhaVermelha = allRoutes.find(r => r.name === "Linha Vermelha");
        const mergeStop = await AppDataSource.getRepository(Station).findOne({ where: { name: "Av. 31 de Janeiro" } });

        if (linhaAzul && linhaVermelha && mergeStop) {
            await AppDataSource.getRepository(RouteConnection).insert([
                { fromRouteId: linhaAzul.id, toRouteId: linhaVermelha.id, stationId: mergeStop.id },
                { fromRouteId: linhaVermelha.id, toRouteId: linhaAzul.id, stationId: mergeStop.id }
            ]);
            console.log(`✅ Created route connections at ${mergeStop.name}`);
        }

    } 
    catch (error) {
        console.error("Error importing routes:", error);
    }
}

async function hydrateCloud() {
    try {

    }
    catch (error) {
        console.error("Error during cloud hydration:", error);
    }
}



async function runHydration(email: string) {
    try {
        await AppDataSource.initialize();

        const alreadyHydrated = await databaseAlreadyHydrated();
        if (alreadyHydrated) {
            console.log("Database already hydrated. Exiting hydration script...");
            return;
        }

        await createNewAdminAccount(email);
    }
    catch (error) {
        console.error("Error during Data Source initialization:", error);
        return;
    }
}


const email = process.argv[2];

if (!email) {
    console.error(
        "Missing required argument: email\n" +
        "Usage: npm run prod:hydration <email>\n" +
        "Example: npm run prod:hydration admin@example.com"
    );
    process.exit(1);
}

runHydration(email).catch((e) => {
    console.error(e);
    process.exit(1);
});
