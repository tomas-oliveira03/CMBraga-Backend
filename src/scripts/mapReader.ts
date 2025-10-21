import fs from "fs";
import path from "path";
import { processKMLFromFile } from "../server/services/kmlParser";

interface FrontendData {
  route: {
    lat: number;
    lon: number;
  }[];
  stops: {
    name: string;
    lat: number;
    lon: number;
    distanceFromStart: number;
    distanceFromPrevious: number;
    timeFromStartMinutes: number;
    type: 'school' | 'regular';
  }[];
  totalDistance: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

async function processKML(kmlPath: string, outputDir: string): Promise<void> {
  console.log(`Processing: ${kmlPath}`);
  
  try {
    // Use kmlParser to process the file
    const routeData = await processKMLFromFile(kmlPath);

    // Convert to frontend format
    const frontendData: FrontendData = {
      route: routeData.route,
      stops: routeData.stops.map((stop, index) => ({
        name: stop.name,
        lat: stop.lat,
        lon: stop.lon,
        distanceFromStart: +(stop.distanceFromStart / 1000).toFixed(3), // Convert to km
        distanceFromPrevious: index === 0 ? 0 : +(stop.distanceFromPrevious / 1000).toFixed(3), // First stop has no previous, convert others to km
        timeFromStartMinutes: index * 2, 
        type: index === routeData.stops.length - 1 ? 'school' as const : 'regular' as const // Last stop is school
      })),
      totalDistance: +(routeData.totalDistance / 1000).toFixed(3), // Convert to km
      bounds: routeData.bounds
    };

    // Generate JSON output path
    const fileName = path.basename(kmlPath, '.kml');
    const jsonOutputPath = path.join(outputDir, `${fileName}.json`);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(jsonOutputPath, JSON.stringify(frontendData, null, 2));
    console.log(`✅ JSON created: ${jsonOutputPath}`);

  } catch (error) {
    console.error(`❌ Error processing ${kmlPath}:`, error instanceof Error ? error.message : String(error));
  }
}

async function processSingleRoute(routeType: string, fileName: string): Promise<void> {
  console.log(`🚀 Processing single route: ${routeType}/${fileName}`);
  
  const baseDir = path.join(process.cwd(), 'src/scripts/routes');
  const routeDir = path.join(baseDir, routeType);
  const kmlDir = path.join(routeDir, 'kml');
  const jsonDir = path.join(routeDir, 'json');
  
  // Validate route type
  if (!['cicloExpresso', 'pedibus'].includes(routeType)) {
    console.error(`❌ Invalid route type: ${routeType}. Must be 'cicloExpresso' or 'pedibus'`);
    process.exit(1);
  }
  
  if (!fs.existsSync(kmlDir)) {
    console.error(`❌ KML directory not found: ${kmlDir}`);
    process.exit(1);
  }
  
  // Add .kml extension if not provided
  const kmlFileName = fileName.endsWith('.kml') ? fileName : `${fileName}.kml`;
  const kmlPath = path.join(kmlDir, kmlFileName);
  
  if (!fs.existsSync(kmlPath)) {
    console.error(`❌ KML file not found: ${kmlPath}`);
    process.exit(1);
  }
  
  try {
    await processKML(kmlPath, jsonDir);
    console.log(`✅ Successfully processed ${routeType}/${kmlFileName}`);
  } catch (error) {
    console.error(`❌ Error processing ${kmlPath}:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// --- Execution ---
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 2) {
    // Two arguments - process specific route and file
    const [routeType, fileName] = args;
    processSingleRoute(routeType!, fileName!).catch(console.error);
  } else {
    console.error("❗ Usage:");
    console.error("  npm run ts-node src/scripts/mapReader.ts <routeType> <fileName>");
    console.error("  Route types: cicloExpresso, pedibus");
    console.error("  Example: npm run ts-node src/scripts/mapReader.ts cicloExpresso LinhaVerde");
    process.exit(1);
  }
}

export { processKML, processSingleRoute };