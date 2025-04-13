<script lang="ts">
	import type { Map, Marker } from 'maplibre-gl';
	import type { StationId } from '$lib/config/stations';
	import { STATION_CONFIGS } from '$lib/config/stations';
	import { ZOOM_BREAKPOINTS } from '$lib/config/constants';
	export let map: Map;
	export let currentFloor: string = 'Ground';
	export let destinationCode: string | undefined;
	export let originCode: string | undefined;
	export let createMarker: (
		iconPath: string,
		coordinates: [number, number],
		minZoom?: number,
		maxZoom?: number
	) => Marker | null;
	export let exitMarkers: Marker[] = [];

	// Define GeoJSON types
	type GeoJSONFeature = {
		type: string;
		geometry: {
			type: string;
			coordinates: [number, number];
		};
		properties: {
			railway?: string;
			ref?: string;
			public_transport?: string;
			station?: string;
			name?: string;
			[key: string]: any;
		};
	};

	type GeoJSONData = {
		type: string;
		features: GeoJSONFeature[];
	};

	// Combined state management
	let state = {
		currentLayers: [] as string[],
		currentZoom: 0,
		visibleStations: [] as StationId[],
		initialized: false,
		preloadedSvgs: {} as Record<string, string>,
		exitPointsData: null as GeoJSONData | null, // Store the GeoJSON data with proper type
		exitPointsLoaded: false // Track if data is loaded
	};

	const stations = Object.keys(STATION_CONFIGS) as StationId[];

	// Function to load exit points data once
	const loadExitPointsData = async (): Promise<GeoJSONData | null> => {
		if (state.exitPointsLoaded && state.exitPointsData) return state.exitPointsData;

		try {
			const response = await fetch('/points.geojson');
			if (!response.ok) {
				throw new Error(`Failed to fetch points: ${response.status}`);
			}
			const data = (await response.json()) as GeoJSONData;
			state.exitPointsData = data;
			state.exitPointsLoaded = true;
			return data;
		} catch (error) {
			console.error('Error loading exit points:', error);
			return null;
		}
	};

	// Function to load and render station exit details
	const loadAndRenderStationDetails = async () => {
		if (!map) return;

		try {
			// Only fetch data if not already loaded
			if (!state.exitPointsLoaded || !state.exitPointsData) {
				const data = await loadExitPointsData();
				if (!data) {
					console.error('Failed to load exit points data');
					return;
				}
			}

			// Now we're certain we have data
			const data = state.exitPointsData!;

			// Clear existing exit markers
			exitMarkers.forEach((marker) => marker.remove());
			exitMarkers = [];

			// Only add exit markers if the current floor is Ground
			if (currentFloor === 'Ground' && data.features) {
				data.features.forEach((feature) => {
					// Only process subway entrance features
					if (feature.properties?.railway === 'subway_entrance' && feature.properties?.ref) {
						const coordinates = feature.geometry.coordinates;
						const exitCode = feature.properties.ref;
						const marker = createMarker(
							`${exitCode.toLowerCase()}.svg`,
							coordinates as [number, number],
							ZOOM_BREAKPOINTS.AREA
						);
						if (marker) exitMarkers.push(marker);
					}
				});
			}
		} catch (error) {
			console.error('Error rendering exit markers:', error);
		}
	};

	// Combined update function for both floor changes and visible stations
	async function updateStationDisplay(newFloor?: string) {
		const zoom = map.getZoom();
		const bounds = map.getBounds();

		// Update current floor if provided
		if (newFloor) {
			// Clear existing layers before changing floor
			await clearExistingLayers();
			currentFloor = newFloor;
			// Load exit markers when floor changes
			loadAndRenderStationDetails();
		}

		// Clear existing layers when zooming out
		if (zoom < ZOOM_BREAKPOINTS.AREA) {
			await clearExistingLayers();
			state.visibleStations = [];
			state.currentZoom = zoom;
			return;
		}

		// Update visible stations with bounds check
		const newVisibleStations = stations.filter((stationId) => {
			const config = STATION_CONFIGS[stationId];
			if (!config?.bounds) return false;

			// Create bounding boxes for efficient intersection testing
			const mapBoundsNE = bounds.getNorthEast();
			const mapBoundsSW = bounds.getSouthWest();

			// Find the min/max coordinates of the station bounds
			const stationMinLng = Math.min(...config.bounds.map((coord) => coord[0]));
			const stationMaxLng = Math.max(...config.bounds.map((coord) => coord[0]));
			const stationMinLat = Math.min(...config.bounds.map((coord) => coord[1]));
			const stationMaxLat = Math.max(...config.bounds.map((coord) => coord[1]));

			// Check if the bounding boxes intersect
			// A station is visible if its bounding box overlaps with the map's visible area
			return !(
				mapBoundsNE.lng < stationMinLng || // Map is completely to the west
				mapBoundsSW.lng > stationMaxLng || // Map is completely to the east
				mapBoundsNE.lat < stationMinLat || // Map is completely to the south
				mapBoundsSW.lat > stationMaxLat // Map is completely to the north
			);
		});

		// Only update if stations changed or floor changed
		const stationsChanged =
			JSON.stringify(newVisibleStations) !== JSON.stringify(state.visibleStations);
		if (!stationsChanged && state.currentZoom === zoom && !newFloor) {
			return;
		}

		state.currentZoom = zoom;
		state.visibleStations = newVisibleStations;

		// Clear existing layers before loading new floor plans
		if (newFloor || stationsChanged) {
			await clearExistingLayers();
		}

		// Load floor plans for visible stations
		await Promise.all(
			state.visibleStations.map((stationId) => loadStationFloorPlan(stationId, currentFloor))
		);

		if (!state.initialized && zoom >= ZOOM_BREAKPOINTS.AREA) {
			state.initialized = true;
		}
	}

	function clearExistingLayers(): Promise<void> {
		return new Promise((resolve) => {
			// Immediately remove layers and sources
			state.currentLayers.forEach((layerId) => {
				if (map.getLayer(layerId)) {
					map.removeLayer(layerId);
					const sourceId = layerId.replace('-layer', '');
					if (map.getSource(sourceId)) {
						map.removeSource(sourceId);
					}
				}
			});
			state.currentLayers = [];
			resolve();
		});
	}

	// Initialize data and set up event listeners
	let isInitialized = false;

	// Only setup event listeners and initial load once
	if (map && !isInitialized) {
		isInitialized = true;

		// Load points data once at startup
		loadExitPointsData().then(() => {
			// Initial render of station details
			loadAndRenderStationDetails();
		});

		map.on('zoom', () => updateFloorPlans());
		map.on('moveend', () => updateFloorPlans());
		updateFloorPlans(currentFloor);
	}

	// Simplified loadStationFloorPlan function
	async function loadStationFloorPlan(stationId: StationId, floor: string) {
		const sourceId = `${stationId}-floor-${floor}`;
		const layerId = `${sourceId}-layer`;

		try {
			if (!STATION_CONFIGS[stationId]?.floors?.includes(floor)) return;

			// Get or fetch PNG URL
			const key = `${stationId}-${floor}`;
			let pngUrl = state.preloadedSvgs[key];

			if (!pngUrl) {
				try {
					pngUrl = await fetchPngUrl(stationId, floor);
				} catch (error) {
					console.error(`Failed to load floor plan for ${stationId}-${floor}:`, error);
					return;
				}
			}

			// Add new source and layer if they don't exist
			if (!map.getSource(sourceId)) {
				map.addSource(sourceId, {
					type: 'image',
					url: pngUrl,
					coordinates: STATION_CONFIGS[stationId].bounds as [
						[number, number],
						[number, number],
						[number, number],
						[number, number]
					]
				});
			}

			if (!map.getLayer(layerId)) {
				// Add the layer and ensure it appears on top by specifying it before all other layers
				map.addLayer({
					id: layerId,
					type: 'raster',
					source: sourceId,
					paint: {
						'raster-opacity': 1,
						'raster-fade-duration': 0
					}
				});

				// Move layer to top
				map.moveLayer(layerId);

				state.currentLayers.push(layerId);
			}
		} catch (error) {
			console.error(`Error in loadStationFloorPlan for ${stationId}-${floor}:`, error);
		}
	}

	// Helper function to fetch PNG URL
	async function fetchPngUrl(stationId: StationId, floor: string): Promise<string> {
		const suffix =
			destinationCode && stationId === destinationCode.toLowerCase() ? 'Out.png' : 'In.png';
		const response = await fetch(`/stations/${stationId}${floor}${suffix}`);
		if (!response.ok) throw new Error(`Failed to fetch PNG: ${response.status}`);
		const blob = await response.blob();
		const pngUrl = URL.createObjectURL(blob);
		state.preloadedSvgs[`${stationId}-${floor}`] = pngUrl;
		return pngUrl;
	}

	// Replace updateFloorPlans with smarter function that avoids unnecessary re-renders
	export function updateFloorPlans(newFloor?: string) {
		// Only clear layers and force update if a new floor is explicitly provided
		if (newFloor && newFloor !== currentFloor) {
			clearExistingLayers().then(() => {
				updateStationDisplay(newFloor);
			});
		} else {
			// For zoom/move events, just call updateStationDisplay without changing floor
			// The updateStationDisplay function already has checks to avoid re-rendering
			// when nothing has changed
			updateStationDisplay();
		}
	}

	// Get available floors for currently visible stations
	$: availableFloors = [
		...new Set(state.visibleStations.flatMap((id) => STATION_CONFIGS[id].floors))
	];

	// Modify reactive statement to avoid unnecessary reload
	let previousData = { floor: currentFloor, origin: originCode, destination: destinationCode };

	$: {
		// Only reload if the values actually changed
		const currentData = { floor: currentFloor, origin: originCode, destination: destinationCode };
		if (
			map &&
			(currentData.floor !== previousData.floor ||
				currentData.origin !== previousData.origin ||
				currentData.destination !== previousData.destination)
		) {
			previousData = { ...currentData };
			loadAndRenderStationDetails();
		} else if (
			map &&
			!originCode &&
			!destinationCode &&
			(previousData.origin || previousData.destination)
		) {
			// Clear exit markers when both origin and destination are reset
			previousData = { ...currentData };
			exitMarkers.forEach((marker) => marker.remove());
			exitMarkers = [];
		}
	}
</script>

<div
	class="pointer-events-auto absolute right-4 top-4 rounded-lg bg-white p-2 shadow-md"
	style="opacity: {state.currentZoom >= ZOOM_BREAKPOINTS.STATION ? 1 : 0};"
>
	{#if state.visibleStations.length > 0}
		<div class="flex flex-col gap-2">
			{#each availableFloors as floor}
				<button
					class="rounded px-4 py-2 {currentFloor === floor
						? 'bg-blue-500 text-white'
						: 'bg-gray-200'}"
					on:click={() => updateFloorPlans(floor)}
				>
					{floor}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.absolute {
		transition: opacity 0.3s ease-in-out;
	}
</style>
