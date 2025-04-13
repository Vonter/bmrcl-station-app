import type { Feature } from 'geojson';
import { stations, STATION_CONFIGS } from '$lib/config/stations';
import pkg from '@mapbox/polyline';
const { decode, encode } = pkg;

interface VoronoiFeature extends Feature {
	properties: {
		name: string;
		station: string;
		ref: string;
	};
	geometry: {
		type: 'Polygon';
		coordinates: number[][][];
	};
}

interface StationPointFeature extends Feature {
	properties: {
		name?: string;
		station: string;
		ref: string;
		railway: string;
	};
	geometry: {
		type: 'Point';
		coordinates: [number, number];
	};
}

interface ValhallaResponse {
	trip: {
		legs: {
			shape: string; // encoded polyline
			summary: {
				time: number; // in seconds
				length: number; // in kilometers
			};
		}[];
	};
}

export interface JourneyDetails {
	originStation: string; // was sourceStation
	destinationStation: string; // no change
	requiresTransfer: boolean; // was hasTransfer

	firstLegExit: string; // was sourceStationRef
	firstLegWalkTime: number; // was walkingTimeToStation, in minutes
	firstLegWalkDistance: number; // was walkingDistanceToStation, in meters
	firstLegPlatform: number; // was platformBeforeTransfer
	firstLegWalkRoute: string; // was walkingRouteToStation, encoded polyline
	firstLegMetroTime: number; // was metroTimeBeforeTransfer, in minutes
	firstLegMetroStops: number; // was metroStopsBeforeTransfer
	firstLegDirectionName: string; // name of the terminal station in direction of travel
	firstLegElevatorDirection: string; // direction of elevator at source station

	secondLegExit: string; // was destStationRef
	secondLegWalkTime: number; // was walkingTimeFromStation, in minutes
	secondLegWalkDistance: number; // was walkingDistanceFromStation, in meters
	secondLegPlatform: number; // was platformAfterTransfer
	secondLegWalkRoute: string; // was walkingRouteFromStation, encoded polyline
	secondLegMetroTime: number; // was metroTimeAfterTransfer, in minutes
	secondLegMetroStops: number; // was metroStopsAfterTransfer
	secondLegDirectionName: string; // name of the terminal station in direction of travel
	secondLegElevatorDirection: string; // direction of elevator at destination station

	transferToColor?: string; // line color to transfer to for interchange trips
	transferToElevatorDirection?: string; // direction of elevator at transfer station

	totalTime: number; // no change, in minutes
	totalDistanceKm: number; // no change, total distance in kilometers
	price: number; // no change, in currency
}

export class JourneyCalculator {
	private voronoiPolygons: VoronoiFeature[] = [];
	private stationPoints: StationPointFeature[] = [];
	private readonly VALHALLA_API_URL = 'https://valhalla1.openstreetmap.de/route';
	private debug: boolean;

	constructor(debug = false) {
		this.debug = debug;
		this.loadVoronoiData();
		this.loadStationPoints();
	}

	public async loadVoronoiData() {
		try {
			const response = await fetch('/voronoi.geojson');
			const data = await response.json();
			this.voronoiPolygons = data.features;
		} catch (error) {
			console.error('JourneyCalculator: Error loading voronoi data:', error);
		}
	}

	public async loadStationPoints() {
		try {
			const response = await fetch('/points.geojson');
			const data = await response.json();
			this.stationPoints = data.features;
		} catch (error) {
			console.error('JourneyCalculator: Error loading station points data:', error);
		}
	}

	private pointInPolygon(point: [number, number], polygon: number[][]): boolean {
		const [x, y] = point;
		let inside = false;

		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const [xi, yi] = polygon[i];
			const [xj, yj] = polygon[j];

			const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

			if (intersect) inside = !inside;
		}

		return inside;
	}

	public findNearestStation(coordinates: [number, number]): [string, string] | null {
		for (const feature of this.voronoiPolygons) {
			const polygon = feature.geometry.coordinates[0];
			if (this.pointInPolygon(coordinates, polygon)) {
				return [feature.properties.station, feature.properties.ref];
			}
		}
		return null;
	}

	private calculateMetroDetails(
		sourceStation: string,
		destStation: string
	): {
		time: number;
		timeBeforeTransfer: number;
		timeAfterTransfer: number;
		stops: number;
		stopsBeforeTransfer: number;
		stopsAfterTransfer: number;
		hasTransfer: boolean;
		platformBeforeTransfer: number;
		platformAfterTransfer: number;
		firstLegDirectionName: string;
		secondLegDirectionName: string;
		firstLegElevatorDirection: string;
		secondLegElevatorDirection: string;
		transferToColor?: string;
	} {
		const sourceStationData = stations.find((s) => s.name === sourceStation);
		const destStationData = stations.find((s) => s.name === destStation);

		if (!sourceStationData || !destStationData) {
			return {
				time: 0,
				timeBeforeTransfer: 0,
				timeAfterTransfer: 0,
				stops: 0,
				stopsBeforeTransfer: 0,
				stopsAfterTransfer: 0,
				hasTransfer: false,
				platformBeforeTransfer: 0,
				platformAfterTransfer: 0,
				firstLegDirectionName: '',
				secondLegDirectionName: '',
				firstLegElevatorDirection: '',
				secondLegElevatorDirection: ''
			};
		}

		// If stations are on the same line, use existing calculation
		if (sourceStationData.color === destStationData.color) {
			const sourceStationIndex = stations.findIndex((s) => s.name === sourceStation);
			const destStationIndex = stations.findIndex((s) => s.name === destStation);
			const stationCount = Math.abs(sourceStationIndex - destStationIndex);

			// Calculate platform based on indices and line color
			let platform = 0;

			// Special case for Green line at Majestic
			if (sourceStationData.color === 'green' && sourceStationData.code === 'KGWA') {
				platform = destStationIndex < sourceStationIndex ? 3 : 4;
			} else {
				// Default logic for all other cases
				platform = destStationIndex < sourceStationIndex ? 1 : 2;
			}

			// Get direction name (terminal station)
			const isAscendingDirection = destStationIndex > sourceStationIndex;
			const sameColorStations = stations.filter((s) => s.color === sourceStationData.color);
			const directionName = isAscendingDirection
				? sameColorStations[sameColorStations.length - 1].name
				: sameColorStations[0].name;

			// Calculate elevator directions
			const firstLegElevatorDirection =
				sourceStationData.code &&
				STATION_CONFIGS[sourceStationData.code.toLowerCase()]?.floors[0] === 'Platform'
					? 'up'
					: 'down';
			const secondLegElevatorDirection =
				destStationData.code &&
				STATION_CONFIGS[destStationData.code.toLowerCase()]?.floors[0] === 'Platform'
					? 'down'
					: 'up';

			return {
				time: 2 * stationCount,
				timeBeforeTransfer: 2 * stationCount,
				timeAfterTransfer: 0,
				stops: stationCount,
				stopsBeforeTransfer: stationCount,
				stopsAfterTransfer: 0,
				hasTransfer: false,
				platformBeforeTransfer: platform,
				platformAfterTransfer: 0,
				firstLegDirectionName: directionName,
				secondLegDirectionName: '',
				firstLegElevatorDirection,
				secondLegElevatorDirection
			};
		}

		// For different lines, calculate time to/from Majestic
		const majesticStation = stations.find(
			(s) => s.name === 'Nadaprabhu Kempegowda Station, Majestic'
		);
		if (!majesticStation) {
			return {
				time: 0,
				timeBeforeTransfer: 0,
				timeAfterTransfer: 0,
				stops: 0,
				stopsBeforeTransfer: 0,
				stopsAfterTransfer: 0,
				hasTransfer: false,
				platformBeforeTransfer: 0,
				platformAfterTransfer: 0,
				firstLegDirectionName: '',
				secondLegDirectionName: '',
				firstLegElevatorDirection: '',
				secondLegElevatorDirection: ''
			};
		}

		// Find indices for both legs of the journey
		const sourceStationIndex = stations.findIndex(
			(s) => s.name === sourceStation && s.color === sourceStationData.color
		);
		const majesticSourceLineIndex = stations.findIndex(
			(s) =>
				s.name === 'Nadaprabhu Kempegowda Station, Majestic' && s.color === sourceStationData.color
		);

		const majesticDestLineIndex = stations.findIndex(
			(s) =>
				s.name === 'Nadaprabhu Kempegowda Station, Majestic' && s.color === destStationData.color
		);
		const destStationIndex = stations.findIndex(
			(s) => s.name === destStation && s.color === destStationData.color
		);

		// Calculate stops
		const stopsToMajestic = Math.abs(sourceStationIndex - majesticSourceLineIndex);
		const stopsFromMajestic = Math.abs(majesticDestLineIndex - destStationIndex);

		// Calculate times (2 minutes per stop)
		const timeToMajestic = 2 * stopsToMajestic;
		const timeFromMajestic = 2 * stopsFromMajestic;

		// Calculate platforms
		let platformBeforeTransfer = 0;
		let platformAfterTransfer = 0;

		// First leg platform calculation
		platformBeforeTransfer = majesticSourceLineIndex < sourceStationIndex ? 1 : 2;

		// Second leg platform calculation
		if (destStationData.color === 'green') {
			platformAfterTransfer = destStationIndex < majesticDestLineIndex ? 3 : 4;
		} else {
			platformAfterTransfer = destStationIndex < majesticDestLineIndex ? 1 : 2;
		}

		// Calculate direction names for both legs
		const sourceColorStations = stations.filter((s) => s.color === sourceStationData.color);
		const destColorStations = stations.filter((s) => s.color === destStationData.color);

		const isFirstLegAscending = majesticSourceLineIndex > sourceStationIndex;
		const isSecondLegAscending = destStationIndex > majesticDestLineIndex;

		const firstLegDirectionName = isFirstLegAscending
			? sourceColorStations[sourceColorStations.length - 1].name
			: sourceColorStations[0].name;

		const secondLegDirectionName = isSecondLegAscending
			? destColorStations[destColorStations.length - 1].name
			: destColorStations[0].name;

		// Add 5 minutes for line change at Majestic
		const lineChangeBuffer = 5;

		// Calculate elevator directions
		const firstLegElevatorDirection =
			sourceStationData.code &&
			STATION_CONFIGS[sourceStationData.code.toLowerCase()]?.floors[0] === 'Platform'
				? 'up'
				: 'down';
		const secondLegElevatorDirection =
			destStationData.code &&
			STATION_CONFIGS[destStationData.code.toLowerCase()]?.floors[0] === 'Platform'
				? 'down'
				: 'up';

		return {
			time: timeToMajestic + timeFromMajestic + lineChangeBuffer,
			timeBeforeTransfer: timeToMajestic,
			timeAfterTransfer: timeFromMajestic,
			stops: stopsToMajestic + stopsFromMajestic,
			stopsBeforeTransfer: stopsToMajestic,
			stopsAfterTransfer: stopsFromMajestic,
			hasTransfer: true,
			platformBeforeTransfer,
			platformAfterTransfer,
			firstLegDirectionName,
			secondLegDirectionName,
			firstLegElevatorDirection,
			secondLegElevatorDirection,
			transferToColor: destStationData.color === 'purple' ? 'Purple' : 'Green'
		};
	}

	private calculateMetroDistance(sourceStation: string, destinationStation: string): number {
		const sourceStationData = stations.find((s) => s.name === sourceStation);
		const destStationData = stations.find((s) => s.name === destinationStation);

		if (!sourceStationData || !destStationData) {
			return 0;
		}

		// If stations are on the same line, calculate direct distance
		if (sourceStationData.color === destStationData.color) {
			// Estimate distance: each station is approximately 1.2 km apart
			const stationCount = Math.abs(
				stations.findIndex((s) => s.name === sourceStation) -
					stations.findIndex((s) => s.name === destinationStation)
			);
			return stationCount * 1.2;
		}

		// For different lines, calculate via Majestic
		const sourceToMajestic = Math.abs(
			stations.findIndex((s) => s.name === sourceStation && s.color === sourceStationData.color) -
				stations.findIndex(
					(s) =>
						s.name === 'Nadaprabhu Kempegowda Station, Majestic' &&
						s.color === sourceStationData.color
				)
		);

		const majesticToDest = Math.abs(
			stations.findIndex(
				(s) =>
					s.name === 'Nadaprabhu Kempegowda Station, Majestic' && s.color === destStationData.color
			) -
				stations.findIndex(
					(s) => s.name === destinationStation && s.color === destStationData.color
				)
		);

		// Estimate total distance: each station is approximately 1.2 km apart
		return (sourceToMajestic + majesticToDest) * 1.2;
	}

	private calculatePrice(sourceStation: string, destinationStation: string): number {
		// Calculate the number of stations in the journey
		const sourceStationData = stations.find((s) => s.name === sourceStation);
		const destStationData = stations.find((s) => s.name === destinationStation);

		if (!sourceStationData || !destStationData) {
			return 0;
		}

		let stationCount = 0;

		// If stations are on the same line
		if (sourceStationData.color === destStationData.color) {
			stationCount = Math.abs(
				stations.findIndex((s) => s.name === sourceStation) -
					stations.findIndex((s) => s.name === destinationStation)
			);
		} else {
			// For different lines, calculate via Majestic
			const sourceToMajestic = Math.abs(
				stations.findIndex((s) => s.name === sourceStation && s.color === sourceStationData.color) -
					stations.findIndex(
						(s) =>
							s.name === 'Nadaprabhu Kempegowda Station, Majestic' &&
							s.color === sourceStationData.color
					)
			);

			const majesticToDest = Math.abs(
				stations.findIndex(
					(s) =>
						s.name === 'Nadaprabhu Kempegowda Station, Majestic' &&
						s.color === destStationData.color
				) -
					stations.findIndex(
						(s) => s.name === destinationStation && s.color === destStationData.color
					)
			);

			stationCount = sourceToMajestic + majesticToDest;
		}

		// Apply fare based on number of stations
		if (stationCount <= 2) return 10;
		if (stationCount <= 4) return 20;
		if (stationCount <= 6) return 30;
		if (stationCount <= 8) return 40;
		if (stationCount <= 10) return 50;
		if (stationCount <= 15) return 60;
		if (stationCount <= 20) return 70;
		if (stationCount <= 25) return 80;
		return 90; // 26 stations or more
	}

	private async getWalkingRoute(
		from: [number, number],
		to: [number, number]
	): Promise<{ duration: number; distance: number; geometry: string } | null> {
		try {
			const requestBody = {
				locations: [
					{ lat: from[1], lon: from[0] },
					{ lat: to[1], lon: to[0] }
				],
				costing: 'pedestrian',
				directions_options: {
					units: 'kilometers'
				}
			};

			// Implement retry mechanism
			const maxRetries = 5;
			let retries = 0;
			let success = false;
			let data: ValhallaResponse | null = null;

			while (!success && retries < maxRetries) {
				try {
					const response = await fetch(this.VALHALLA_API_URL, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(requestBody)
					});

					if (response.ok) {
						data = (await response.json()) as ValhallaResponse;
						success = true;
					} else {
						retries++;
						if (retries < maxRetries) {
							await new Promise((resolve) => setTimeout(resolve, 2000));
						}
					}
				} catch (error) {
					console.error(`JourneyCalculator: Error on attempt ${retries + 1}:`, error);
					retries++;
					if (retries < maxRetries) {
						await new Promise((resolve) => setTimeout(resolve, 2000));
					}
				}
			}

			if (!success || !data || !data.trip?.legs?.[0]) {
				return null;
			}

			const duration = data.trip.legs[0].summary.time / 60; // Convert seconds to minutes
			const distance = data.trip.legs[0].summary.length * 1000; // Convert km to meters

			// Decode Valhalla's polyline (precision=6) and re-encode for Mapbox (precision=5)
			const decodedPoints = decode(data.trip.legs[0].shape);
			const mapboxPolyline = encode(decodedPoints);

			return {
				duration,
				distance,
				geometry: mapboxPolyline
			};
		} catch (error) {
			console.error('JourneyCalculator: Error fetching walking route:', error);
			return null;
		}
	}

	private getStationPointCoordinates(
		stationCode: string | null,
		pointRef: string
	): [number, number] | null {
		if (!stationCode) return null;

		const point = this.stationPoints.find(
			(p) => p.properties.station === stationCode && p.properties.ref === pointRef
		);

		if (point) {
			return point.geometry.coordinates;
		}

		return null;
	}

	async calculateJourney(
		sourceCoords: [number, number],
		destCoords: [number, number]
	): Promise<JourneyDetails | null> {
		if (this.voronoiPolygons.length === 0) {
			await this.loadVoronoiData();
		}

		if (this.stationPoints.length === 0) {
			await this.loadStationPoints();
		}

		const [sourceStationCode, sourceStationRef] = this.findNearestStation(sourceCoords) || ['', ''];
		const [destinationStationCode, destStationRef] = this.findNearestStation(destCoords) || [
			'',
			''
		];

		const sourceStation = stations.find((s) => s.code === sourceStationCode)?.name;
		const destinationStation = stations.find((s) => s.code === destinationStationCode)?.name;

		if (!sourceStation || !destinationStation) {
			return null;
		}

		const sourceStationCoords =
			this.getStationPointCoordinates(sourceStationCode, sourceStationRef) ||
			stations.find((s) => s.code === sourceStationCode)?.coordinates;

		const destStationCoords =
			this.getStationPointCoordinates(destinationStationCode, destStationRef) ||
			stations.find((s) => s.code === destinationStationCode)?.coordinates;

		if (!sourceStationCoords || !destStationCoords) {
			return null;
		}

		const [walkToStation, walkFromStation] = await Promise.all([
			this.getWalkingRoute(sourceCoords, sourceStationCoords),
			this.getWalkingRoute(destStationCoords, destCoords)
		]);

		if (!walkToStation || !walkFromStation) {
			return null;
		}

		// Calculate walking times and metro times
		const walkingTimeToStation = Math.ceil(walkToStation.duration);
		const walkingTimeFromStation = Math.ceil(walkFromStation.duration);
		const walkingDistanceToStation = Math.round(walkToStation.distance);
		const walkingDistanceFromStation = Math.round(walkFromStation.distance);

		// Get detailed metro information
		const metroDetails = this.calculateMetroDetails(sourceStation, destinationStation);
		const stationBuffer = 6; // Adding 6 minutes buffer for station activities
		const totalTime =
			walkingTimeToStation + metroDetails.time + walkingTimeFromStation + stationBuffer;
		const metroDistanceKm = this.calculateMetroDistance(sourceStation, destinationStation);
		const totalDistanceKm = (
			(walkingDistanceToStation + walkingDistanceFromStation) / 1000 +
			metroDistanceKm
		).toFixed(2);

		console.log('JourneyCalculator: Journey calculation complete', {
			walkingTimeToStation,
			walkingDistanceToStation,
			metroTime: metroDetails.time,
			metroStops: metroDetails.stops,
			hasTransfer: metroDetails.hasTransfer,
			platformBeforeTransfer: metroDetails.platformBeforeTransfer,
			platformAfterTransfer: metroDetails.platformAfterTransfer,
			walkingTimeFromStation,
			walkingDistanceFromStation,
			totalDistanceKm,
			stationBuffer,
			totalTime
		});

		const price = this.calculatePrice(sourceStation, destinationStation);

		return {
			originStation: sourceStation,
			destinationStation,
			firstLegExit: sourceStationRef,
			secondLegExit: destStationRef,
			firstLegWalkTime: walkingTimeToStation,
			firstLegWalkDistance: walkingDistanceToStation,
			firstLegWalkRoute: walkToStation.geometry,
			secondLegWalkTime: walkingTimeFromStation,
			secondLegWalkDistance: walkingDistanceFromStation,
			secondLegWalkRoute: walkFromStation.geometry,
			firstLegMetroTime: metroDetails.timeBeforeTransfer,
			secondLegMetroTime: metroDetails.timeAfterTransfer,
			firstLegMetroStops: metroDetails.stopsBeforeTransfer,
			secondLegMetroStops: metroDetails.stopsAfterTransfer,
			requiresTransfer: metroDetails.hasTransfer,
			firstLegPlatform: metroDetails.platformBeforeTransfer,
			secondLegPlatform: metroDetails.platformAfterTransfer,
			firstLegDirectionName: metroDetails.firstLegDirectionName,
			secondLegDirectionName: metroDetails.secondLegDirectionName,
			firstLegElevatorDirection: metroDetails.firstLegElevatorDirection,
			secondLegElevatorDirection: metroDetails.secondLegElevatorDirection,
			...(metroDetails.hasTransfer && {
				transferToElevatorDirection: metroDetails.transferToColor === 'Purple' ? 'up' : 'down',
				transferToColor: metroDetails.transferToColor
			}),
			totalTime,
			totalDistanceKm: Number(totalDistanceKm),
			price
		};
	}
}
