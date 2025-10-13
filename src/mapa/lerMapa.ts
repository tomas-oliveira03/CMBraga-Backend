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

function toArray<T>(v: T | T[] | undefined | null): T[] {
  return (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);
}

function cumulativeDistances(points: Point[]): number[] {
  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev && curr) {
      const d = haversine(prev, curr);
      total += d;
      cum.push(total);
    } else {
      cum.push(total);
    }
  }
  return cum;
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

async function processKMZ(kmzPath: string, outputCsvPath: string): Promise<void> {
  // 1️⃣ Extrair .kml
  const kmzData = fs.readFileSync(kmzPath);
  const zip = await JSZip.loadAsync(kmzData);
  const kmlFile = Object.keys(zip.files).find(f => f.toLowerCase().endsWith(".kml"));
  if (!kmlFile) throw new Error("Nenhum ficheiro .kml encontrado dentro do .kmz!");
  const kmlEntry = zip.files[kmlFile];
  if (!kmlEntry) throw new Error("Erro ao abrir o ficheiro KML dentro do KMZ.");
  const kmlText = await kmlEntry.async("string");

  // 2️⃣ Parse XML
  const parser = new XMLParser({ ignoreAttributes: false });
  const kml = parser.parse(kmlText);

  // 3️⃣ Extrair rota (LineString)
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
  if (linePoints.length < 2) throw new Error("Nenhuma rota encontrada no ficheiro!");

  const cumDistMeters = cumulativeDistances(linePoints);

  // 4️⃣ Extrair paragens (Placemarks)
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

  if (placemarks.length < 2)
    throw new Error("É necessário pelo menos duas paragens para calcular distâncias.");

  // 5️⃣ Determinar distância real entre paragens, seguindo a rota
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

  // 6️⃣ Escrever CSV
  const csvWriter = createObjectCsvWriter({
    path: outputCsvPath,
    header: [
      { id: "name", title: "name" },
      { id: "lat", title: "lat" },
      { id: "lon", title: "lon" },
      { id: "dist_from_previous_km", title: "dist_from_previous_km" },
    ],
  });

  await csvWriter.writeRecords(results);
  console.log(`✅ CSV criado: ${outputCsvPath}`);
}

// --- Execução ---
const kmzFile = process.argv[2];
if (!kmzFile) {
  console.error("❗ Usa: ts-node lerMapa.ts <ficheiro.kmz>");
  process.exit(1);
}

const output = path.basename(kmzFile, ".kmz") + "_rota_real.csv";
processKMZ(kmzFile, output).catch(console.error);
