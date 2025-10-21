import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import haversine from "haversine-distance";

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
	dist_from_previous_m: number | null;
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

export async function processKMLFromURL(kmlUrl: string): Promise<RouteData> {
	// Fetch KML file from URL
	const response = await fetch(kmlUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch KML file from URL: ${response.statusText}`);
	}
	
	const kmlText = await response.text();
	return await processKMLData(kmlText);
}

// Read KML file from local path
export async function processKMLFromFile(kmlPath: string): Promise<RouteData> {
	// Read KML file from local path
	const fs = await import('fs');
	const kmlText = fs.readFileSync(kmlPath, 'utf-8');
	return await processKMLData(kmlText);
}

// Make processKMLData public so it can be used by other modules
export async function processKMLData(kmlText: string): Promise<RouteData> {
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
	if (linePoints.length < 2) throw new Error("Nenhuma rota encontrada no ficheiro!");

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

	if (placemarks.length < 2)
		throw new Error("É necessário pelo menos duas paragens para calcular distâncias.");

	// Calculate distances along the route for each stop
	const stopData: Array<{ placemark: Placemark; distanceAlongRoute: number; routeIndex: number }> = [];
	
	for (const pm of placemarks) {
		const idx = findClosestPointIndex(pm, linePoints);
		const distAtPm = cumDistMeters[idx] ?? 0;
		stopData.push({
			placemark: pm,
			distanceAlongRoute: distAtPm,
			routeIndex: idx
		});
	}

	// Sort stops by distance along route to ensure correct order
	stopData.sort((a, b) => a.distanceAlongRoute - b.distanceAlongRoute);

	// --- FIX: Use first stop's route index as offset ---
	const firstStopRouteIdx = stopData[0]?.routeIndex ?? 0;
	const offsetDistance = cumDistMeters[firstStopRouteIdx] ?? 0;

	// Create results with proper distance calculations
	const results: OutputRow[] = [];
	for (let i = 0; i < stopData.length; i++) {
		const current = stopData[i]!;
		
		let dist_from_previous_m: number | null = null;
		if (i > 0) {
			const previous = stopData[i - 1]!;
			const diffMeters = (current.distanceAlongRoute - offsetDistance) - (previous.distanceAlongRoute - offsetDistance);
			dist_from_previous_m = Math.max(0, Math.trunc(diffMeters));
		}
		
		results.push({
			name: current.placemark.name,
			lat: current.placemark.lat,
			lon: current.placemark.lon,
			dist_from_previous_m,
		});
	}

	const routeData: RouteData = {
		route: linePoints,
		stops: results.map((result, index) => ({
			name: result.name,
			lat: result.lat,
			lon: result.lon,
			distanceFromStart: Math.trunc((stopData[index]?.distanceAlongRoute ?? 0) - offsetDistance),
			distanceFromPrevious: result.dist_from_previous_m || 0,
		})),
		totalDistance: Math.trunc(
			(cumDistMeters[cumDistMeters.length - 1] || 0) - offsetDistance
		),
		bounds: {
			north: Math.max(...linePoints.map(p => p.lat)),
			south: Math.min(...linePoints.map(p => p.lat)),
			east: Math.max(...linePoints.map(p => p.lon)),
			west: Math.min(...linePoints.map(p => p.lon)),
		}
	};

	return routeData;
}

