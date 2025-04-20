import maplibre from 'maplibre-gl';
import { stations } from '$lib/config/stations';
import { JourneyCalculator } from './JourneyCalculator';
import { ZOOM_BREAKPOINTS } from '$lib/config/constants';

// Calculate distance between two points
export const calculateDistance = (point1: [number, number], point2: [number, number]) => {
	const dx = point1[0] - point2[0];
	const dy = point1[1] - point2[1];
	return Math.sqrt(dx * dx + dy * dy);
};

// Find the closest point on a line segment to a given point
export const findClosestPointOnSegment = (
	p1: [number, number],
	p2: [number, number],
	p: [number, number]
): [number, number] => {
	const x1 = p1[0],
		y1 = p1[1];
	const x2 = p2[0],
		y2 = p2[1];
	const x = p[0],
		y = p[1];

	const dx = x2 - x1;
	const dy = y2 - y1;
	const segmentLengthSq = dx * dx + dy * dy;

	if (segmentLengthSq === 0) return p1;

	const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / segmentLengthSq));
	return [x1 + t * dx, y1 + t * dy];
};

// Find the nearest point on a line to a given coordinate
export const findNearestPointOnLine = (
	lineCoordinates: [number, number][],
	point: [number, number]
) => {
	let minDistance = Infinity;
	let nearestPoint: [number, number] = lineCoordinates[0];
	let nearestSegmentIndex = 0;

	for (let i = 0; i < lineCoordinates.length - 1; i++) {
		const p1 = lineCoordinates[i];
		const p2 = lineCoordinates[i + 1];
		const closestPoint = findClosestPointOnSegment(p1, p2, point);
		const distance = calculateDistance(closestPoint, point);

		if (distance < minDistance) {
			minDistance = distance;
			nearestPoint = closestPoint;
			nearestSegmentIndex = i;
		}
	}

	// Create a new array with the new point inserted at the appropriate position
	const updatedLineCoordinates = [...lineCoordinates];

	// Insert the nearest point into the line coordinates at the appropriate position
	// We insert after the segment index
	updatedLineCoordinates.splice(nearestSegmentIndex + 1, 0, nearestPoint);

	return {
		point: nearestPoint,
		segmentIndex: nearestSegmentIndex,
		distance: minDistance,
		updatedLineCoordinates
	};
};

// Determine which line color to use based on stations
export const determineLineColor = (sourceStation: string, destinationStation: string) => {
	const sourceStationData = stations.find((s) => s.code === sourceStation);
	const destStationData = stations.find((s) => s.code === destinationStation);

	if (sourceStationData && destStationData) {
		if (sourceStationData.color === destStationData.color) {
			return sourceStationData.color === 'purple' ? '#951A74' : '#0F883B';
		}
		if (sourceStationData.color !== destStationData.color) {
			return 'both';
		}
	}
	return '#951A74';
};

// Helper function to get stations between two points based on sequence in stations array
const getStationsBetween = (start: any, end: any, lineColor: string) => {
	const lineStations = stations.filter((s) => s.color === lineColor);
	const startIndex = lineStations.findIndex((s) => s.name === start.name);
	const endIndex = lineStations.findIndex((s) => s.name === end.name);

	if (startIndex === -1 || endIndex === -1) {
		console.error('Could not find start or end station in sequence');
		return [];
	}

	if (startIndex <= endIndex) {
		return lineStations.slice(startIndex, endIndex + 1);
	} else {
		return lineStations.slice(endIndex, startIndex + 1).reverse();
	}
};

// Helper function to add station markers
const addStationMarkers = (
	map: maplibre.Map,
	stationsOnRoute: any[],
	origin: any,
	destination: any
) => {
	if (!map) return;

	const stationFeatures = stationsOnRoute.map((station) => ({
		type: 'Feature' as const,
		properties: {
			name: station.name,
			color: station.color
		},
		geometry: {
			type: 'Point' as const,
			coordinates: station.coordinates
		}
	}));

	// Check if the source already exists
	if (map.getSource('station-markers-source')) {
		(map.getSource('station-markers-source') as maplibre.GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: stationFeatures
		});
	} else {
		// Add the source if it doesn't exist
		map.addSource('station-markers-source', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: stationFeatures
			}
		});
	}

	// Check if the layer already exists
	if (map.getLayer('station-markers')) {
		map.removeLayer('station-markers');
	}
	// Create a new symbol layer with the metro.svg icon
	map.addLayer({
		id: 'station-markers',
		type: 'symbol',
		source: 'station-markers-source',
		layout: {
			'icon-image': 'metro-icon',
			'icon-size': 0.8,
			'icon-allow-overlap': true,
			'icon-ignore-placement': true
		},
		maxzoom: ZOOM_BREAKPOINTS.AREA,
		minzoom: ZOOM_BREAKPOINTS.CITY
	});
};

// Helper function to process a line and create the segment
const processLine = (
	map: maplibre.Map,
	lineFeature: any,
	colorName: string,
	startStation: any,
	endStation: any
) => {
	if (!map) return;

	const colorHex = colorName === 'purple' ? '#951A74' : '#0F883B';
	const borderColor = colorName === 'purple' ? '#4E0A3C' : '#0D381D';
	const layerId = `route-highlight-${colorName}`;
	const borderLayerId = `route-highlight-border-${colorName}`;
	const sourceId = `${layerId}-source`;

	if (map.getSource(sourceId)) {
		if (map.getLayer(layerId)) {
			map.removeLayer(layerId);
		}
		if (map.getLayer(borderLayerId)) {
			map.removeLayer(borderLayerId);
		}
		map.removeSource(sourceId);
	}

	map.addSource(sourceId, {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: []
		}
	});

	// Add border layer first (underneath)
	map.addLayer({
		id: borderLayerId,
		type: 'line',
		source: sourceId,
		layout: {
			'line-join': 'round',
			'line-cap': 'round'
		},
		paint: {
			'line-color': borderColor,
			'line-width': 12,
			'line-opacity': 0.9
		}
	});

	// Add main line layer on top
	map.addLayer({
		id: layerId,
		type: 'line',
		source: sourceId,
		layout: {
			'line-join': 'round',
			'line-cap': 'round'
		},
		paint: {
			'line-color': colorHex,
			'line-width': 8,
			'line-opacity': 0.9
		}
	});

	let lineCoordinates = lineFeature.geometry.coordinates;
	if (lineCoordinates.length > 0 && Array.isArray(lineCoordinates[0][0])) {
		lineCoordinates = lineCoordinates.flat();
	}

	const startResult = findNearestPointOnLine(lineCoordinates, startStation.coordinates);
	lineCoordinates = startResult.updatedLineCoordinates;
	const endResult = findNearestPointOnLine(lineCoordinates, endStation.coordinates);
	lineCoordinates = endResult.updatedLineCoordinates;

	const startIndex = Math.min(startResult.segmentIndex, endResult.segmentIndex);
	const endIndex = Math.max(startResult.segmentIndex, endResult.segmentIndex) + 1;

	const segmentCoordinates = lineCoordinates.slice(startIndex, endIndex + 2);

	if (map.getSource(sourceId)) {
		(map.getSource(sourceId) as maplibre.GeoJSONSource).setData({
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: segmentCoordinates
			}
		});
	}
};

// Render full line with lower opacity
const renderFullLine = (map: maplibre.Map, lineFeature: any, colorName: string) => {
	if (!map) return;

	const colorHex = colorName === 'purple' ? '#951A74' : '#0F883B';
	const layerId = `route-full-${colorName}`;
	const borderLayerId = `route-full-border-${colorName}`;
	const sourceId = `${layerId}-source`;

	if (map.getSource(sourceId)) {
		if (map.getLayer(layerId)) {
			map.removeLayer(layerId);
		}
		if (map.getLayer(borderLayerId)) {
			map.removeLayer(borderLayerId);
		}
		map.removeSource(sourceId);
	}

	map.addSource(sourceId, {
		type: 'geojson',
		data: lineFeature
	});

	// Add white border layer first (underneath)
	map.addLayer({
		id: borderLayerId,
		type: 'line',
		source: sourceId,
		layout: {
			'line-join': 'round',
			'line-cap': 'round'
		},
		paint: {
			'line-color': '#FFFFFF',
			'line-width': 4,
			'line-opacity': 0.9
		}
	});

	// Add main line layer on top
	map.addLayer({
		id: layerId,
		type: 'line',
		source: sourceId,
		layout: {
			'line-join': 'round',
			'line-cap': 'round'
		},
		paint: {
			'line-color': colorHex,
			'line-width': 2,
			'line-opacity': 0.9
		}
	});
};

// Highlight the relevant segments of the metro lines
export const highlightRelevantSegments = async (
	map: maplibre.Map,
	origin: any,
	destination: any
) => {
	if (!map || !origin || !destination) return;

	// Remove existing layers and sources
	[
		'route-highlight-purple',
		'route-highlight-green',
		'route-highlight-border-purple',
		'route-highlight-border-green'
	].forEach((layerId) => {
		if (map.getLayer(layerId)) {
			map.removeLayer(layerId);
		}
	});

	// Remove sources (only need to remove main sources as they're shared between main and border layers)
	['route-highlight-purple-source', 'route-highlight-green-source'].forEach((sourceId) => {
		if (map.getSource(sourceId)) {
			map.removeSource(sourceId);
		}
	});

	if (map.getLayer('station-markers')) {
		map.removeLayer('station-markers');
	}
	if (map.getSource('station-markers-source')) {
		map.removeSource('station-markers-source');
	}

	const journeyCalculator = new JourneyCalculator(true);
	await journeyCalculator.loadVoronoiData();

	const [sourceStation, sourceStationRef] = journeyCalculator.findNearestStation(
		origin.coordinates
	) || ['', ''];
	const [destinationStation, destinationStationRef] = journeyCalculator.findNearestStation(
		destination.coordinates
	) || ['', ''];

	if (!sourceStation || !destinationStation) {
		return;
	}

	const lineColor = determineLineColor(sourceStation, destinationStation);
	const sourceStationData = stations.find((s) => s.code === sourceStation);
	const destStationData = stations.find((s) => s.code === destinationStation);

	if (!sourceStationData?.coordinates || !destStationData?.coordinates) {
		return;
	}

	const interchangeStation = stations.find(
		(s) => s.name === 'Nadaprabhu Kempegowda Station, Majestic'
	);

	const bounds = new maplibre.LngLatBounds();
	bounds.extend(sourceStationData.coordinates);
	bounds.extend(destStationData.coordinates);
	if (interchangeStation) bounds.extend(interchangeStation.coordinates);

	let stationsOnRoute: any[] = [];

	fetch('/bmrcl.geojson')
		.then((response) => response.json())
		.then((data) => {
			// Filter line features once
			const purpleLineFeatures = data.features.filter(
				(feature: any) => feature.properties.colour === 'purple'
			);

			const greenLineFeatures = data.features.filter(
				(feature: any) => feature.properties.colour === 'green'
			);

			// Now handle the journey-specific highlighting
			if (lineColor === 'both' && interchangeStation) {
				const firstLineStations = getStationsBetween(
					sourceStationData,
					interchangeStation,
					sourceStationData.color
				);
				const secondLineStations = getStationsBetween(
					interchangeStation,
					destStationData,
					destStationData.color
				);
				stationsOnRoute = [...firstLineStations, ...secondLineStations];

				if (sourceStationData.color === 'purple' || destStationData.color === 'purple') {
					if (purpleLineFeatures.length > 0) {
						const purpleStart =
							sourceStationData.color === 'purple' ? sourceStationData : interchangeStation;
						const purpleEnd =
							destStationData.color === 'purple' ? destStationData : interchangeStation;
						processLine(map, purpleLineFeatures[0], 'purple', purpleStart, purpleEnd);
					}
				}

				if (sourceStationData.color === 'green' || destStationData.color === 'green') {
					if (greenLineFeatures.length > 0) {
						const greenStart =
							sourceStationData.color === 'green' ? sourceStationData : interchangeStation;
						const greenEnd =
							destStationData.color === 'green' ? destStationData : interchangeStation;
						processLine(map, greenLineFeatures[0], 'green', greenStart, greenEnd);
					}
				}
			} else {
				stationsOnRoute = getStationsBetween(
					sourceStationData,
					destStationData,
					sourceStationData.color
				);

				const colorName = sourceStationData.color;
				const lineFeatures = data.features.filter(
					(feature: any) => feature.properties.colour === colorName
				);

				if (lineFeatures.length > 0) {
					processLine(map, lineFeatures[0], colorName, sourceStationData, destStationData);
				}
			}

			addStationMarkers(map, stationsOnRoute, sourceStationData, destStationData);
		})
		.catch((error) => {
			console.error('Error fetching or processing GeoJSON:', error);
		});
};

// Create a new function to render all station icons and metro lines
export const renderAllStationsAndLines = async (map: maplibre.Map) => {
	if (!map) return;

	// Fetch the GeoJSON data
	try {
		const response = await fetch('/bmrcl.geojson');
		const data = await response.json();

		// Render both full lines
		const purpleLineFeatures = data.features.filter(
			(feature: any) => feature.properties.colour === 'purple'
		);

		const greenLineFeatures = data.features.filter(
			(feature: any) => feature.properties.colour === 'green'
		);

		if (purpleLineFeatures.length > 0) {
			renderFullLine(map, purpleLineFeatures[0], 'purple');
		}

		if (greenLineFeatures.length > 0) {
			renderFullLine(map, greenLineFeatures[0], 'green');
		}

		// Render all station markers
		addStationMarkers(map, stations, null, null);
	} catch (error) {
		console.error('Error fetching or processing GeoJSON:', error);
	}
};
