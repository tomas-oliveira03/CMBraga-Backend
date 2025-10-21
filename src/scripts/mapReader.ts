import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import haversine from "haversine-distance";
import { createObjectCsvWriter } from "csv-writer";

interface Point {
  lat: number;
  lon: number;
}
interface Placemark {
  name: string;
  lat: number;
  lon: number;
}
interface OutputRow {
  name: string;
  lat: number;
  lon: number;
  dist_from_previous_km: number | null;
}

interface FrontendData {
  route: Point[];
  stops: {
    name: string;
    lat: number;
    lon: number;
    distanceFromStart: number;
    distanceFromPrevious: number | null;
    timeFromPrevious: number | null;
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

function toArray<T>(v: T | T[] | undefined | null): T[] {
  return (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);
}

function cumulativeDistances(points: Point[]): number[] {
  const cumulative: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev && curr) {
      const d = haversine(prev, curr);
      total += d;
      cumulative.push(total);
    } else {
      cumulative.push(total);
    }
  }
  return cumulative;
}

function findClosestPointIndex(target: Point, line: Point[]): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    if (!p) continue;
    const d = haversine(target, p);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

async function processKML(kmlPath: string, outputDir: string): Promise<void> {
  console.log(`Processing: ${kmlPath}`);
  
  try {
    // Read KML file directly
    const kmlText = fs.readFileSync(kmlPath, 'utf-8');

    // Parse XML
    const parser = new XMLParser({ ignoreAttributes: false });
    const kml = parser.parse(kmlText);

    // Extract route (LineString)
    let linePoints: Point[] = [];
    const extractLines = (obj: any): void => {
      if (!obj) return;
      if (obj.LineString?.coordinates) {
        const coordsText = obj.LineString.coordinates.trim();
        const coords = coordsText.split(/\s+/);
        for (const c of coords) {
          const [lonStr, latStr] = c.split(",");
          const lat = Number(latStr);
          const lon = Number(lonStr);
          if (!isNaN(lat) && !isNaN(lon)) linePoints.push({ lat, lon });
        }
      }
      for (const key in obj) {
        if (typeof obj[key] === "object") extractLines(obj[key]);
      }
    };
    extractLines(kml);
    
    if (linePoints.length < 2) {
      throw new Error("No route found in file!");
    }

    const cumDistMeters = cumulativeDistances(linePoints);

    // Extract stops (Placemarks)
    const placemarks: Placemark[] = [];
    const extractPlacemarks = (obj: any): void => {
      if (!obj) return;
      if (obj.Placemark) {
        for (const pm of toArray(obj.Placemark)) {
          const name = pm.name ? String(pm.name) : "";
          const coordsText = pm?.Point?.coordinates;
          if (coordsText) {
            const [lonStr, latStr] = coordsText.trim().split(",");
            const lat = Number(latStr);
            const lon = Number(lonStr);
            if (!isNaN(lat) && !isNaN(lon)) placemarks.push({ name, lat, lon });
          }
        }
      }
      for (const key in obj) {
        if (typeof obj[key] === "object") extractPlacemarks(obj[key]);
      }
    };
    extractPlacemarks(kml);

    if (placemarks.length < 2) {
      throw new Error("At least two stops are required to calculate distances.");
    }

    // Determine real distance between stops, following the route
    const results: OutputRow[] = [];
    const distAlongRoute: number[] = [];

    for (const pm of placemarks) {
      const idx = findClosestPointIndex(pm, linePoints);
      const distAtPm = cumDistMeters[idx] ?? 0;
      distAlongRoute.push(distAtPm);
    }

    for (let i = 0; i < placemarks.length; i++) {
      const current = placemarks[i];
      if (!current) continue;
      let dist_from_previous_km: number | null = null;
      if (i > 0 && distAlongRoute[i] !== undefined && distAlongRoute[i - 1] !== undefined) {
        const diffMeters = distAlongRoute[i]! - distAlongRoute[i - 1]!;
        dist_from_previous_km = +(diffMeters / 1000).toFixed(3);
      }
      results.push({
        name: current.name,
        lat: current.lat,
        lon: current.lon,
        dist_from_previous_km,
      });
    }

    // Generate JSON for frontend
    const frontendData: FrontendData = {
      route: linePoints,
      stops: results.map((result, index) => {
        
        return {
          name: result.name,
          lat: result.lat,
          lon: result.lon,
          distanceFromStart: +(distAlongRoute[index]! / 1000).toFixed(3),
          distanceFromPrevious: result.dist_from_previous_km,
          timeFromPrevious: 2,
          type: 'school' as const
        };
      }),
      totalDistance: +((cumDistMeters[cumDistMeters.length - 1] || 0) / 1000).toFixed(3),
      bounds: {
        north: Math.max(...linePoints.map(p => p.lat)),
        south: Math.min(...linePoints.map(p => p.lat)),
        east: Math.max(...linePoints.map(p => p.lon)),
        west: Math.min(...linePoints.map(p => p.lon)),
      }
    };

    // Generate JSON output path in the json folder
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