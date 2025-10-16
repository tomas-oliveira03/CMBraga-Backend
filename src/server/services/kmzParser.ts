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
	dist_from_previous_m: number | null; // renamed and now in meters as integer
}

interface RouteData {
	route: Point[];
	stops: {
		name: string;
		lat: number;
		lon: number;
		distanceFromStart: number;
		distanceFromPrevious: number;
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

export async function processKMZFromURL(kmzUrl: string): Promise<RouteData> {
	// Fetch KMZ file from URL
	const response = await fetch(kmzUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch KMZ file from URL: ${response.statusText}`);
	}
	
	const arrayBuffer = await response.arrayBuffer();
	const kmzData = Buffer.from(arrayBuffer);
	return await processKMZData(kmzData);
}

async function processKMZData(kmzData: Buffer): Promise<RouteData> {
	const zip = await JSZip.loadAsync(kmzData);
	const kmlFile = Object.keys(zip.files).find(f => f.toLowerCase().endsWith(".kml"));
	if (!kmlFile) throw new Error("Nenhum ficheiro .kml encontrado dentro do .kmz!");
	const kmlEntry = zip.files[kmlFile];
	if (!kmlEntry) throw new Error("Erro ao abrir o ficheiro KML dentro do KMZ.");
	const kmlText = await kmlEntry.async("string");

	// Parse XML
	const parser = new XMLParser({ ignoreAttributes: false });
	const kml = parser.parse(kmlText);

	// Extrair rota (LineString)
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

	// Extrair paragens (Placemarks)
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

	// Determinar distância real entre paragens, seguindo a rota
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
		let dist_from_previous_m: number | null = null;
		if (i > 0 && distAlongRoute[i] !== undefined && distAlongRoute[i - 1] !== undefined) {
			const diffMeters = distAlongRoute[i]! - distAlongRoute[i - 1]!;
			dist_from_previous_m = Math.trunc(diffMeters); 
		}
		results.push({
			name: current.name,
			lat: current.lat,
			lon: current.lon,
			dist_from_previous_m,
		});
	}

	const routeData: RouteData = {
		route: linePoints,
		stops: results.map((result, index) => ({
			name: result.name,
			lat: result.lat,
			lon: result.lon,
			distanceFromStart: Math.trunc(distAlongRoute[index]!), 
			distanceFromPrevious: result.dist_from_previous_m || 0,     
		})),
		totalDistance: Math.trunc(cumDistMeters[cumDistMeters.length - 1] || 0), 
		bounds: {
			north: Math.max(...linePoints.map(p => p.lat)),
			south: Math.min(...linePoints.map(p => p.lat)),
			east: Math.max(...linePoints.map(p => p.lon)),
			west: Math.min(...linePoints.map(p => p.lon)),
		}
	};

	return routeData;
}

