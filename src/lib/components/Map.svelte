<script lang="ts">
	import { onMount } from 'svelte';

	import maplibre, { type Marker } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import polyline from '@mapbox/polyline';

	import { journeyStore } from '$lib/stores/journey';
	import StationFloorPlan from './StationFloorPlan.svelte';
	import { highlightRelevantSegments, renderAllStationsAndLines } from '$lib/utils/mapHelpers';
	import { stations } from '$lib/config/stations';
	import { ZOOM_BREAKPOINTS } from '$lib/config/constants';

	export let zoom: number = 12;
	export let walkingRouteToStation: string | undefined = undefined;
	export let walkingRouteFromStation: string | undefined = undefined;
	export let originCode: string | undefined = undefined;
	export let destinationCode: string | undefined = undefined;

	let mapContainer: HTMLDivElement;
	let map: maplibre.Map | undefined;
	let markers: maplibre.Marker[] = [];
	let exitMarkers: Marker[] = [];

	// Bengaluru coordinates
	const BENGALURU_CENTER = {
		lng: 77.5946,
		lat: 12.9716,
		zoom: 11
	};

	// Subscribe to journey store
	$: ({ origin, destination } = $journeyStore);

	// Helper function to create and add a marker
	const createMarker = (
		iconPath: string,
		coordinates: [number, number],
		minZoom?: number,
		maxZoom?: number,
		height?: string,
		width?: string
	) => {
		if (!map) return null;

		const icon = document.createElement('div');
		icon.className = 'marker';
		icon.style.backgroundSize = 'contain';
		icon.style.cursor = 'pointer';
		icon.style.backgroundImage = `url(../icons/${iconPath})`;
		icon.style.height = height || '24px';
		icon.style.width = width || '24px';

		const marker = new maplibre.Marker({ element: icon }).setLngLat(coordinates).addTo(map);

		// Set initial visibility based on current zoom
		if (minZoom !== undefined || maxZoom !== undefined) {
			const currentMapZoom = map.getZoom();
			const isVisible =
				(minZoom === undefined || currentMapZoom >= minZoom) &&
				(maxZoom === undefined || currentMapZoom <= maxZoom);
			marker.getElement().style.display = isVisible ? 'block' : 'none';

			// Store zoom constraints on the marker element for later checks
			marker.getElement().dataset.minZoom = minZoom?.toString() || '';
			marker.getElement().dataset.maxZoom = maxZoom?.toString() || '';
		}

		return marker;
	};

	// Update marker visibility based on current zoom level
	const updateMarkerVisibility = () => {
		if (!map) return;

		const currentMapZoom = map.getZoom();

		// Update all markers (including exit markers)
		[...markers, ...exitMarkers].forEach((marker) => {
			if (!marker) return;

			const element = marker.getElement();
			const minZoom = element.dataset.minZoom ? parseFloat(element.dataset.minZoom) : undefined;
			const maxZoom = element.dataset.maxZoom ? parseFloat(element.dataset.maxZoom) : undefined;

			if (minZoom !== undefined || maxZoom !== undefined) {
				const isVisible =
					(minZoom === undefined || currentMapZoom >= minZoom) &&
					(maxZoom === undefined || currentMapZoom <= maxZoom);
				element.style.display = isVisible ? 'block' : 'none';
			}
		});
	};

	// Add station name labels to the map using symbol layers
	const updateStationLabels = () => {
		if (!map) return;

		// Don't update if the map style isn't loaded yet
		if (!map.isStyleLoaded()) {
			setTimeout(updateStationLabels, 100);
			return;
		}

		// Remove existing label sources and layers if they exist
		if (map.getLayer('station-labels')) {
			map.removeLayer('station-labels');
		}
		if (map.getSource('station-labels-source')) {
			map.removeSource('station-labels-source');
		}

		const originStation = stations.find((s) => s.code === originCode);
		const destinationStation = stations.find((s) => s.code === destinationCode);

		// Only proceed if we have stations to label
		if (!originStation && !destinationStation) return;

		// Create features for station labels
		const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

		if (originStation) {
			features.push({
				type: 'Feature',
				properties: {
					name: originStation.name
				},
				geometry: {
					type: 'Point',
					coordinates: originStation.coordinates
				}
			});
		}

		if (destinationStation && destinationStation.code !== originStation?.code) {
			features.push({
				type: 'Feature',
				properties: {
					name: destinationStation.name
				},
				geometry: {
					type: 'Point',
					coordinates: destinationStation.coordinates
				}
			});
		}

		// Add source for station labels
		map.addSource('station-labels-source', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features
			}
		});

		// Add symbol layer for station labels
		map.addLayer({
			id: 'station-labels',
			type: 'symbol',
			source: 'station-labels-source',
			layout: {
				'text-field': ['get', 'name'],
				'text-size': 14,
				'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
				'text-radial-offset': 0.8,
				'text-justify': 'auto',
				'text-allow-overlap': true,
				'text-ignore-placement': false,
				visibility: 'visible',
				'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
			},
			paint: {
				'text-color': '#333',
				'text-halo-color': '#fff',
				'text-halo-width': 2,
				'text-halo-blur': 0.5
			},
			minzoom: ZOOM_BREAKPOINTS.CITY
		});
	};

	// Clear existing markers and add new ones for origin and destination
	const updateMarkers = () => {
		if (!map) return;

		// Clear existing markers
		markers.forEach((marker) => marker.remove());
		markers = [];

		// Add markers for origin and destination if they exist
		const points = [
			origin && { name: origin.name, coordinates: origin.coordinates, type: 'origin' },
			destination && {
				name: destination.name,
				coordinates: destination.coordinates,
				type: 'destination'
			}
		].filter(Boolean);

		// Add journey start/end markers
		points.forEach((point) => {
			if (point?.coordinates && map) {
				const iconPath = point.type === 'origin' ? 'start.svg' : 'end.svg';
				const marker =
					point.type === 'origin'
						? createMarker(
								iconPath,
								point.coordinates,
								ZOOM_BREAKPOINTS.CITY,
								undefined,
								'16px',
								'16px'
							)
						: createMarker(
								iconPath,
								point.coordinates,
								ZOOM_BREAKPOINTS.CITY,
								undefined,
								'19.2px',
								'24px'
							);
				if (marker) markers.push(marker);
			}
		});

		// Fit bounds if both origin and destination exist
		if (origin?.coordinates && destination?.coordinates) {
			const bounds = new maplibre.LngLatBounds()
				.extend(origin.coordinates)
				.extend(destination.coordinates);
			map.fitBounds(bounds, {
				padding: { top: 100, left: 100, right: 100, bottom: 300 },
				maxZoom: 14
			});
		} else if (origin?.coordinates) {
			map.flyTo({ center: origin.coordinates, zoom: 13 });
		} else if (destination?.coordinates) {
			map.flyTo({ center: destination.coordinates, zoom: 13 });
		}

		// Update station labels after markers are set
		updateStationLabels();
	};

	// Add or update walking route layers
	const updateWalkingRoutes = () => {
		if (!map) return;

		// Don't try to update routes if the map style isn't loaded yet
		if (!map.isStyleLoaded()) {
			// Try again after a short delay
			setTimeout(updateWalkingRoutes, 100);
			return;
		}

		// Helper function to update a single route
		const updateRoute = (routePolyline: string | undefined, sourceId: string, layerId: string) => {
			if (!map) return;

			// Remove existing route layer if it exists
			if (map.getLayer(layerId)) {
				map.removeLayer(layerId);
			}

			if (map.getSource(sourceId)) {
				map.removeSource(sourceId);
			}

			if (!routePolyline) return;

			try {
				// Decode the polyline and scale the coordinates by dividing by 10
				const coordinates = polyline
					.decode(routePolyline)
					.map((point: [number, number]) => [point[1] / 10, point[0] / 10]);

				if (coordinates.length > 0) {
					map.addSource(sourceId, {
						type: 'geojson',
						data: {
							type: 'Feature',
							properties: {},
							geometry: {
								type: 'LineString',
								coordinates
							}
						}
					});

					map.addLayer({
						id: layerId,
						type: 'line',
						source: sourceId,
						layout: {
							'line-join': 'round',
							'line-cap': 'round'
						},
						paint: {
							'line-color': '#0F4AF8',
							'line-width': 4,
							'line-opacity': 0.8
						}
					});
				}
			} catch (error) {
				console.error(`Error rendering ${sourceId}:`, error);
			}
		};

		// Update both routes
		updateRoute(walkingRouteToStation, 'route-to-station', 'route-to-station-layer');
		updateRoute(walkingRouteFromStation, 'route-from-station', 'route-from-station-layer');
	};

	// Clear walking route layers and sources
	const clearWalkingRoutes = () => {
		if (!map) return;

		// Remove walking route layers
		['route-to-station-layer', 'route-from-station-layer'].forEach((layerId) => {
			if (map?.getLayer(layerId)) {
				map?.removeLayer(layerId);
			}
		});

		// Remove walking route sources
		['route-to-station', 'route-from-station'].forEach((sourceId) => {
			if (map?.getSource(sourceId)) {
				map?.removeSource(sourceId);
			}
		});
	};

	// Clear all journey-related map elements (routes, highlights, markers)
	const resetMapJourney = () => {
		if (!map) return;

		// Remove walking routes
		clearWalkingRoutes();

		// Remove highlighted metro segments
		[
			'route-highlight-purple',
			'route-highlight-green',
			'route-highlight-border-purple',
			'route-highlight-border-green'
		].forEach((layerId) => {
			if (map?.getLayer(layerId)) {
				map?.removeLayer(layerId);
			}
		});

		// Remove station labels
		if (map.getLayer('station-labels')) {
			map.removeLayer('station-labels');
		}
		if (map.getSource('station-labels-source')) {
			map.removeSource('station-labels-source');
		}

		// Clear all markers
		markers.forEach((marker) => marker.remove());
		markers = [];
		exitMarkers.forEach((marker) => marker.remove());
		exitMarkers = [];

		// Reset to default view
		map.flyTo({
			center: [BENGALURU_CENTER.lng, BENGALURU_CENTER.lat],
			zoom: BENGALURU_CENTER.zoom,
			essential: true
		});

		// Re-render base map with all stations and lines
		renderAllStationsAndLines(map);
	};

	// Initialize the map
	onMount(() => {
		map = new maplibre.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
			center: [BENGALURU_CENTER.lng, BENGALURU_CENTER.lat],
			zoom: BENGALURU_CENTER.zoom
		});

		// Add zoom change listener
		map.on('zoom', () => {
			if (map) {
				updateMarkerVisibility();
			}
		});

		// Wait for the style to load before adding layers
		map.on('load', () => {
			// Preload the metro icon for station markers
			const img = new Image();
			img.onload = () => {
				if (map) {
					map.addImage('metro-icon', img);

					// Render all stations and lines by default
					renderAllStationsAndLines(map);

					// Then handle any active journey if needed
					updateMarkers();
					updateWalkingRoutes();
					if (origin && destination && map) {
						highlightRelevantSegments(map, origin, destination);
					}
				}
			};
			img.onerror = () => {
				console.error('Failed to load metro icon.');
				updateMarkers();
				updateWalkingRoutes();
				if (origin && destination && map) {
					highlightRelevantSegments(map, origin, destination);
				}
			};
			img.src = '../icons/metro.svg';
		});

		return () => {
			markers.forEach((marker) => marker.remove());
			exitMarkers.forEach((marker) => marker.remove());
			map?.remove();
		};
	});

	// Reactive statements for updates
	$: if (map && (origin || destination)) {
		updateMarkers();
		if (origin && destination) {
			highlightRelevantSegments(map, origin, destination);
		}
	}

	$: if (map && (walkingRouteToStation || walkingRouteFromStation)) {
		updateWalkingRoutes();
	} else if (map && walkingRouteToStation === undefined && walkingRouteFromStation === undefined) {
		resetMapJourney();
	}

	// Update station labels whenever origin or destination station codes change
	$: if (map && (originCode || destinationCode)) {
		if (map.isStyleLoaded()) {
			updateStationLabels();
		} else {
			// If style isn't loaded yet, wait for it and then update
			const checkAndUpdate = () => {
				if (map && map.isStyleLoaded()) {
					updateStationLabels();
				} else {
					setTimeout(checkAndUpdate, 100);
				}
			};
			checkAndUpdate();
		}
	}
</script>

<div class="relative h-full w-full">
	<div bind:this={mapContainer} class="absolute inset-0 h-full w-full" />
	{#if map}
		<div class="pointer-events-none absolute inset-0">
			<StationFloorPlan {map} {destinationCode} {originCode} {createMarker} bind:exitMarkers />
		</div>
	{/if}
</div>

<style>
	:global(.maplibregl-canvas) {
		width: 100%;
		height: 100%;
	}

	:global(.marker) {
		display: block;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		padding: 0;
	}
</style>
