<script lang="ts">
	import 'carbon-components-svelte/css/all.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { TextInput } from 'carbon-components-svelte';

	import Map from '$lib/components/Map.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { JourneyCalculator } from '$lib/utils/JourneyCalculator';
	import type { JourneyDetails as JourneyDetailsType } from '$lib/utils/JourneyCalculator';
	import { stations } from '$lib/config/stations';
	import { journeyStore } from '$lib/stores/journey';

	// Get journey query from URL parameters
	$: from = '';
	$: to = '';
	$: fromCoords = [0, 0] as [number, number];
	$: toCoords = [0, 0] as [number, number];

	let journeyCalculator: JourneyCalculator;
	let journeyDetails: JourneyDetailsType | null = null;
	let firstLegWalkRoute: string | undefined;
	let secondLegWalkRoute: string | undefined;
	let originCode: string | undefined;
	let destinationCode: string | undefined;

	let isLoading: boolean = false;
	let hasInterchange: boolean = false;
	let sidebarView: 'explore' | 'journey' = 'explore';

	// Origin/destination inputs for journey planner
	let origin = '';
	let destination = '';
	let originInput: HTMLInputElement;
	let destinationInput: HTMLInputElement;

	// Add details state
	let originDetails: { lat: number; lng: number; name: string } | null = null;
	let destinationDetails: { lat: number; lng: number; name: string } | null = null;

	// Journey plan details for the sidebar
	let planDetails = {
		firstMileDistance: 500,
		firstMileTime: 16,
		metroRide1Ref: '',
		metroRide1Time: 16,
		metroRide1Stops: 0,
		metroRide1Platform: 0,
		metroRide1DirectionName: '',
		metroRide1ElevatorDirection: '',
		interchangeRequired: false,
		interchangeColor: '',
		interchangeElevatorDirection: '',
		metroRide2Ref: '',
		metroRide2Time: 24,
		metroRide2Stops: 0,
		metroRide2Platform: 0,
		metroRide2DirectionName: '',
		metroRide2ElevatorDirection: '',
		lastMileDistance: 600,
		lastMileTime: 16
	};

	// Initialize calculator and calculate journey when in browser
	$: if (browser && from && to) {
		if (!journeyCalculator) {
			journeyCalculator = new JourneyCalculator();
		}
		calculateJourney();
		sidebarView = 'journey';
	}

	// Add a type guard for the Place result
	function isPlace(place: unknown): place is google.maps.places.PlaceResult {
		return (
			place !== null && typeof place === 'object' && 'geometry' in place && place.geometry !== null
		);
	}

	async function calculateJourney() {
		try {
			// Validate coordinates before calculation
			if (!fromCoords || !toCoords || fromCoords.length !== 2 || toCoords.length !== 2) {
				console.error('Invalid coordinates:', { fromCoords, toCoords });
				return;
			}

			isLoading = true;
			journeyDetails = await journeyCalculator.calculateJourney(fromCoords, toCoords);
			console.log('Journey details:', journeyDetails);

			// Get station colors from the stations array
			const sourceStation = stations.find((s) => s.name === journeyDetails?.originStation);
			const destStation = stations.find((s) => s.name === journeyDetails?.destinationStation);

			// Determine if interchange is needed (different colored lines)
			hasInterchange = sourceStation?.color !== destStation?.color;

			firstLegWalkRoute = journeyDetails?.firstLegWalkRoute;
			secondLegWalkRoute = journeyDetails?.secondLegWalkRoute;
			originCode = sourceStation?.code;
			destinationCode = destStation?.code;

			// Update plan details
			if (journeyDetails) {
				planDetails = {
					firstMileDistance: journeyDetails.firstLegWalkDistance || 500,
					firstMileTime: journeyDetails.firstLegWalkTime || 16,
					metroRide1Ref: journeyDetails?.firstLegExit,
					metroRide1Time: journeyDetails.firstLegMetroTime || 16,
					metroRide1Stops: journeyDetails.firstLegMetroStops || 0,
					metroRide1Platform: journeyDetails.firstLegPlatform || 0,
					metroRide1DirectionName: journeyDetails.firstLegDirectionName || '',
					metroRide1ElevatorDirection: journeyDetails.firstLegElevatorDirection || '',
					interchangeRequired: journeyDetails.requiresTransfer,
					interchangeColor: journeyDetails.transferToColor || '',
					interchangeElevatorDirection: journeyDetails.transferToElevatorDirection || '',
					metroRide2Ref: journeyDetails?.secondLegExit,
					metroRide2Time: journeyDetails.secondLegMetroTime || 16,
					metroRide2Stops: journeyDetails.secondLegMetroStops || 0,
					metroRide2Platform: journeyDetails.secondLegPlatform || 0,
					metroRide2DirectionName: journeyDetails.secondLegDirectionName || '',
					metroRide2ElevatorDirection: journeyDetails.secondLegElevatorDirection || '',
					lastMileDistance: journeyDetails.secondLegWalkDistance || 600,
					lastMileTime: journeyDetails.secondLegWalkTime || 16
				};
			}
		} catch (error) {
			console.error('Error calculating journey:', error);
			journeyDetails = null;
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		// Wait for google maps to be loaded
		await new Promise<void>((resolve) => {
			const checkGoogle = () => {
				if (window.google && window.google.maps && window.google.maps.places) {
					resolve();
				} else {
					setTimeout(checkGoogle, 100);
				}
			};
			checkGoogle();
		});

		const bounds = new window.google.maps.LatLngBounds(
			new window.google.maps.LatLng(12, 76), // SW corner
			new window.google.maps.LatLng(14, 79) // NE corner
		);

		const autocompleteOptions: google.maps.places.AutocompleteOptions = {
			fields: ['place_id', 'name', 'formatted_address', 'geometry'],
			strictBounds: true
		};

		// Initialize Google Places Autocomplete for origin
		if (originInput) {
			const originAutocomplete = new window.google.maps.places.Autocomplete(
				originInput,
				autocompleteOptions
			);
			// Use type assertion to fix the TypeScript error
			(originAutocomplete as any).setBounds(bounds);

			// Update the input values when a place is selected
			originAutocomplete.addListener('place_changed', () => {
				const place = originAutocomplete.getPlace();
				if (!isPlace(place)) return;

				origin =
					place.name && place.formatted_address
						? `${place.name}, ${place.formatted_address}`
						: place.formatted_address || place.name || '';

				const location = place.geometry?.location;
				if (location) {
					originDetails = {
						lat: location.lat(),
						lng: location.lng(),
						name: place.name || ''
					};

					// Check if both fields are filled and auto-submit
					if (destination && destinationDetails) {
						handleSubmit();
					}
				}
			});
		}

		// Initialize Google Places Autocomplete for destination
		if (destinationInput) {
			const destinationAutocomplete = new window.google.maps.places.Autocomplete(
				destinationInput,
				autocompleteOptions
			);
			// Use type assertion to fix the TypeScript error
			(destinationAutocomplete as any).setBounds(bounds);

			destinationAutocomplete.addListener('place_changed', () => {
				const place = destinationAutocomplete.getPlace();
				if (!isPlace(place)) return;

				destination =
					place.name && place.formatted_address
						? `${place.name}, ${place.formatted_address}`
						: place.formatted_address || place.name || '';

				const location = place.geometry?.location;
				if (location) {
					destinationDetails = {
						lat: location.lat(),
						lng: location.lng(),
						name: place.name || ''
					};

					// Check if both fields are filled and auto-submit
					if (origin && originDetails) {
						handleSubmit();
					}
				}
			});
		}
	});

	function handleSubmit() {
		if (origin && destination && originDetails && destinationDetails) {
			// Set loading state to true
			isLoading = true;

			// Update the journey store
			journeyStore.setLocations(
				{
					name: originDetails.name,
					coordinates: [originDetails.lng, originDetails.lat]
				},
				{
					name: destinationDetails.name,
					coordinates: [destinationDetails.lng, destinationDetails.lat]
				}
			);

			// Calculate journey
			from = originDetails.name;
			to = destinationDetails.name;
			fromCoords = [originDetails.lng, originDetails.lat];
			toCoords = [destinationDetails.lng, destinationDetails.lat];

			sidebarView = 'journey';

			// Trigger journey calculation
			calculateJourney();
		}
	}

	// Default train frequency in minutes
	const TRAIN_FREQUENCY = 6;
</script>

<main class="absolute inset-0 flex h-full flex-col md:flex-row">
	<Sidebar
		origin={from}
		destination={to}
		minutes={journeyDetails?.totalTime ?? 0}
		price={journeyDetails?.price ?? 0}
		totalDistanceKm={journeyDetails?.totalDistanceKm ?? 0}
		{planDetails}
		station1Name={journeyDetails?.originStation ?? ''}
		station2Name={journeyDetails?.destinationStation ?? ''}
		loading={isLoading}
		{hasInterchange}
		view={sidebarView}
		{handleSubmit}
		on:reset={() => {
			// Reset all relevant state
			from = '';
			to = '';
			origin = '';
			destination = '';
			originDetails = null;
			destinationDetails = null;
			journeyDetails = null;
			isLoading = false;
			sidebarView = 'explore';
			firstLegWalkRoute = undefined;
			secondLegWalkRoute = undefined;
			originCode = undefined;
			destinationCode = undefined;
			fromCoords = [0, 0];
			toCoords = [0, 0];

			// Reset the journey store which will clear markers
			journeyStore.reset();

			// Reinitialize autocomplete after a short delay to ensure the DOM is updated
			setTimeout(() => {
				if (window.google && window.google.maps && window.google.maps.places) {
					const bounds = new window.google.maps.LatLngBounds(
						new window.google.maps.LatLng(12, 76), // SW corner
						new window.google.maps.LatLng(14, 79) // NE corner
					);

					const autocompleteOptions: google.maps.places.AutocompleteOptions = {
						fields: ['place_id', 'name', 'formatted_address', 'geometry'],
						strictBounds: true
					};

					// Reinitialize autocomplete for origin
					if (originInput) {
						const originAutocomplete = new window.google.maps.places.Autocomplete(
							originInput,
							autocompleteOptions
						);
						(originAutocomplete as any).setBounds(bounds);

						originAutocomplete.addListener('place_changed', () => {
							const place = originAutocomplete.getPlace();
							if (!isPlace(place)) return;

							origin =
								place.name && place.formatted_address
									? `${place.name}, ${place.formatted_address}`
									: place.formatted_address || place.name || '';

							const location = place.geometry?.location;
							if (location) {
								originDetails = {
									lat: location.lat(),
									lng: location.lng(),
									name: place.name || ''
								};

								if (destination && destinationDetails) {
									handleSubmit();
								}
							}
						});
					}

					// Reinitialize autocomplete for destination
					if (destinationInput) {
						const destinationAutocomplete = new window.google.maps.places.Autocomplete(
							destinationInput,
							autocompleteOptions
						);
						(destinationAutocomplete as any).setBounds(bounds);

						destinationAutocomplete.addListener('place_changed', () => {
							const place = destinationAutocomplete.getPlace();
							if (!isPlace(place)) return;

							destination =
								place.name && place.formatted_address
									? `${place.name}, ${place.formatted_address}`
									: place.formatted_address || place.name || '';

							const location = place.geometry?.location;
							if (location) {
								destinationDetails = {
									lat: location.lat(),
									lng: location.lng(),
									name: place.name || ''
								};

								if (origin && originDetails) {
									handleSubmit();
								}
							}
						});
					}
				}
			}, 100);
		}}
	>
		<svelte:fragment slot="originInput">
			<TextInput
				id="origin"
				bind:ref={originInput}
				placeholder="Where will you start from?"
				bind:value={origin}
				size="xl"
				disabled={isLoading}
				required
				labelText="Origin"
				inline={false}
				class="w-full"
			/>
		</svelte:fragment>
		<svelte:fragment slot="destinationInput">
			<TextInput
				id="destination"
				bind:ref={destinationInput}
				placeholder="Where do you want to go?"
				bind:value={destination}
				size="xl"
				disabled={isLoading}
				required
				labelText="Destination"
				inline={false}
				class="w-full"
			/>
		</svelte:fragment>
	</Sidebar>

	<div class="relative order-first flex-1 md:order-last">
		<Map
			walkingRouteToStation={firstLegWalkRoute}
			walkingRouteFromStation={secondLegWalkRoute}
			{originCode}
			{destinationCode}
		/>
	</div>
</main>
