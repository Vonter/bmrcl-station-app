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
	export let metroRide1Ref: string | undefined = undefined;
	export let metroRide2Ref: string | undefined = undefined;
	export let metroRide1Platform: string | undefined = undefined;
	export let metroRide2Platform: string | undefined = undefined;

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
		width?: string,
		anchor?: string
	) => {
		if (!map) return null;

		const icon = document.createElement('div');
		icon.style.backgroundSize = 'contain';
		icon.style.cursor = 'pointer';
		icon.style.backgroundImage = `url(../icons/${iconPath})`;
		icon.style.height = height || '24px';
		icon.style.width = width || '24px';

		const marker = new maplibre.Marker({ 
			element: icon,
			anchor: anchor as any || 'center'
		}).setLngLat(coordinates).addTo(map);

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

	// Update station name labels to the map using symbol layers
	const updateStationLabels = () => {
		if (!map) return;

		// Don't update if the map style isn't loaded yet
		if (!map.isStyleLoaded()) {
			setTimeout(updateStationLabels, 100);
			return;
		}
		
		// If source doesn't exist, generate all features once
		if (!map.getSource('station-labels-source')) {
			// Create features for all stations with visibility properties
			let features: GeoJSON.Feature<GeoJSON.Point>[] = [];
			
			// First deduplicate stations by code
			const uniqueStations = Array.from(
				new Map(stations.map(station => [station.code, station])).values()
			);
			
			// Add all stations with their visibility properties
			uniqueStations.forEach(station => {
				const isTerminal = ['BIET', 'CLGD', 'APTS', 'WHTM'].includes(station.code);
				
				features.push({
					type: 'Feature',
					properties: {
						name: station.name,
						code: station.code,
						// Define at which zoom levels this station should be visible
						showAtCityLevel: isTerminal, // Show terminals at city level
						showAtSuburbLevel: features.length % 2 === 0, // Show every other station at suburb level
						showAtAreaLevel: true, // Show all stations at area level
						isOriginOrDestination: false // Will be updated dynamically
					},
					geometry: {
						type: 'Point',
						coordinates: station.coordinates
					}
				});
			});
			
			// Add source for station labels
			map.addSource('station-labels-source', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features
				}
			});
		}
		
		// Update origin/destination status for all features
		const source = map.getSource('station-labels-source') as maplibre.GeoJSONSource;
		const data = source.serialize().data as GeoJSON.FeatureCollection;
		if (data && data.features) {
			// Reset all isOriginOrDestination flags
			data.features.forEach(feature => {
				if (feature.properties) {
					feature.properties.isOriginOrDestination = 
						(originCode && feature.properties.code === originCode) || 
						(destinationCode && feature.properties.code === destinationCode);
				}
			});
			
			// Update the source data
			source.setData(data);
		}

		// Add symbol layer for station labels with filters based on zoom and properties
		if (!map.getLayer('station-labels')) {
			// If layer doesn't exist, create it
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
				filter: ['any', 
					['==', ['get', 'isOriginOrDestination'], true],
					['==', ['get', 'showAtCityLevel'], true]
				] // Default filter - only show city level stations
			});
		}

		// Ensure station labels are on top
		moveLayerToTop('station-labels');
	};

	// Update filter for station labels based on current zoom level
	const updateStationLabelFilter = () => {
		if (!map || !map.getLayer('station-labels')) return;

		const currentZoom = map.getZoom();
		
		// Define filter based on zoom level and origin/destination status
		if (originCode || destinationCode) {
			// Show only origin/destination stations
			map.setFilter('station-labels', ['==', ['get', 'isOriginOrDestination'], true]);
		} else if (currentZoom >= ZOOM_BREAKPOINTS.AREA) {
			// Show all stations at high zoom levels
			map.setFilter('station-labels', ['any', 
				['==', ['get', 'showAtAreaLevel'], true],
				['==', ['get', 'isOriginOrDestination'], true]
			]);
		} else if (currentZoom >= ZOOM_BREAKPOINTS.SUBURB && currentZoom < ZOOM_BREAKPOINTS.AREA) {
			// Show suburb level stations
			map.setFilter('station-labels', ['any', 
				['==', ['get', 'showAtSuburbLevel'], true],
				['==', ['get', 'isOriginOrDestination'], true]
			]);
		} else if (currentZoom >= ZOOM_BREAKPOINTS.CITY && currentZoom < ZOOM_BREAKPOINTS.SUBURB) {
			// Show only city level stations
			map.setFilter('station-labels', ['any',
				['==', ['get', 'showAtCityLevel'], true],
				['==', ['get', 'isOriginOrDestination'], true]
			]);
		} else if (currentZoom < ZOOM_BREAKPOINTS.CITY) {
			// Hide all stations
			map.setFilter('station-labels', ['==', false, true]);
		}
		
		// Ensure station labels remain on top after filter updates
		moveLayerToTop('station-labels');
	};

	// Helper function to move a layer to the top
	const moveLayerToTop = (layerId: string) => {
		if (!map || !map.getLayer(layerId)) return;
		try {
			map.moveLayer(layerId);
		} catch (error) {
			console.error(`Error moving layer ${layerId} to top:`, error);
		}
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
		// Make sure station labels are above other layers
		moveLayerToTop('station-labels');
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
		
		// Re-add and update station labels
		updateStationLabels();
	};

	// Initialize the map
	onMount(() => {
		map = new maplibre.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
			center: [BENGALURU_CENTER.lng, BENGALURU_CENTER.lat],
			zoom: BENGALURU_CENTER.zoom
		});

		// Add compass (navigation control) in the bottom right
		map.addControl(new maplibre.NavigationControl(), 'bottom-right');

		// Add zoom change listener
		map.on('zoom', () => {
			if (map) {
				updateMarkerVisibility();
				updateStationLabelFilter();
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
					
					// Initialize station labels
					updateStationLabels();

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
			// Ensure station labels stay on top after adding route highlights
			moveLayerToTop('station-labels');
		}
	}

	$: if (map && (walkingRouteToStation || walkingRouteFromStation)) {
		updateWalkingRoutes();
		// Ensure station labels stay on top after adding walking routes
		moveLayerToTop('station-labels');
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

	// Move station labels to top whenever exitMarkers change (station plan rendering)
	$: if (map && exitMarkers.length) {
		moveLayerToTop('station-labels');
	}
</script>

<div class="relative h-full w-full">
	<div bind:this={mapContainer} class="absolute inset-0 h-full w-full" />
	{#if map}
		<div class="pointer-events-none absolute inset-0">
			<StationFloorPlan
				{map}
				{destinationCode}
				{originCode}
				{createMarker}
				bind:exitMarkers
				{metroRide1Ref}
				{metroRide2Ref}
				{metroRide1Platform}
				{metroRide2Platform}
			/>
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
