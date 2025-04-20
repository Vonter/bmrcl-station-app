<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { TextInput, Tag } from 'carbon-components-svelte';

	// Props to match what's in the image
	export let origin: string;
	export let destination: string;
	export let minutes: number = 0;
	export let price: number = 0;
	export let loading: boolean = false;
	export let totalDistanceKm: number = 0;
	export let planDetails: {
		firstMileDistance: number;
		firstMileTime: number;
		interchangeRequired: boolean;
		interchangeColor: string;
		metroRide1Time: number;
		metroRide1Stops: number;
		metroRide1Ref: string;
		metroRide1Platform: number;
		metroRide1DirectionName: string;
		metroRide2Time: number;
		metroRide2Stops: number;
		metroRide2Ref: string;
		metroRide2Platform: number;
		metroRide2DirectionName: string;
		lastMileDistance: number;
		lastMileTime: number;
	} = {
		firstMileDistance: 0,
		firstMileTime: 0,
		interchangeRequired: false,
		interchangeColor: '',
		metroRide1Time: 0,
		metroRide1Stops: 0,
		metroRide1Ref: '',
		metroRide1Platform: 0,
		metroRide1DirectionName: '',
		metroRide2Time: 0,
		metroRide2Stops: 0,
		metroRide2Ref: '',
		metroRide2Platform: 0,
		metroRide2DirectionName: '',
		lastMileDistance: 0,
		lastMileTime: 0
	};
	export let station1Name: string = '';
	export let station2Name: string = '';
	export let hasInterchange: boolean = false;

	// New props for the journey planner form
	export let view: 'explore' | 'journey' = 'explore';
	export let handleSubmit: () => void;

	// Create event dispatcher
	const dispatch = createEventDispatcher();

	function goBack() {
		dispatch('reset');
		view = 'explore';
	}
</script>

<div
	class="flex h-1/3 w-full flex-col overflow-auto transition-all duration-300 md:h-full md:w-1/3 2xl:w-1/4"
>
	<div class="flex h-full flex-col">
		{#if view === 'journey'}
			<!-- Header with Back Button -->
			<div class="border-b p-4">
				<button class="flex items-center" on:click={goBack}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mr-2"
					>
						<path d="M19 12H5" />
						<path d="M12 19l-7-7 7-7" />
					</svg>
				</button>
			</div>
			<!-- Origin & Destination Info -->
			<div class="hidden border-b p-4 md:block">
				<div class="mb-4">
					<TextInput
						id="origin-readonly"
						placeholder="Where will you start from?"
						value={origin}
						size="sm"
						labelText="Origin"
						inline={false}
						class="w-full"
						readonly={true}
					/>
				</div>
				<div>
					<TextInput
						id="destination-readonly"
						placeholder="Where do you want to go?"
						value={destination}
						size="sm"
						labelText="Destination"
						inline={false}
						class="w-full"
						readonly={true}
					/>
				</div>
			</div>

			<!-- Journey Plan -->
			<div class="flex-grow overflow-y-auto p-4">
				{#if loading}
					<!-- Loading state -->
					<div class="flex h-full flex-col items-center justify-center">
						<div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-blue-500"></div>
						<p>Calculating best route...</p>
					</div>
				{:else}
					<!-- Journey Stats -->
					<div class="mb-4">
						<div class="flex flex-row gap-2">
							<Tag type="outline" size="default">{totalDistanceKm} km</Tag>
							<Tag type="outline" size="default">{minutes} minutes</Tag>
							<Tag type="outline" size="default">₹{price}</Tag>
						</div>
					</div>

					<p class="mb-4 text-xs font-light">Suggested journey plan</p>

					<!-- Start Location -->
					<div class="mb-4 flex items-start">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
							<img src="/icons/sidebar-start.svg" alt="Start location" width="16" height="16" />
						</div>
						<div>
							<p>Start Location</p>
							<ul class="list-disc px-4 text-sm">
								<li>{origin}</li>
							</ul>
						</div>
					</div>

					<!-- First Mile -->
					<div class="mb-4 flex items-start">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
							<img src="/icons/sidebar-first.svg" alt="First mile" width="16" height="16" />
						</div>
						<div>
							<p>First Mile</p>
							<ul class="list-disc px-4 text-sm">
								<li>
									Walk {planDetails.firstMileDistance >= 1000
										? (planDetails.firstMileDistance / 1000).toFixed(1) + ' km'
										: planDetails.firstMileDistance + 'm'} ({planDetails.firstMileTime} minutes)
								</li>
							</ul>
						</div>
					</div>

					<!-- First Station -->
					<div class="mb-4 flex items-start">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
							<img src="/icons/sidebar-metro.svg" alt="First station" width="16" height="16" />
						</div>
						<div>
							<p>{station1Name} Metro Station</p>
							<ul class="list-disc px-4 text-sm">
								<li>Gate {planDetails.metroRide1Ref}</li>
								<li>
									Platform {planDetails.metroRide1Platform}
								</li>
								<li>Towards {planDetails.metroRide1DirectionName}</li>
							</ul>
						</div>
					</div>

					<!-- First Ride -->
					<div class="mb-4 flex items-start">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
							<img src="/icons/sidebar-ride.svg" alt="First ride" width="16" height="16" />
						</div>
						<div>
							<p>Ride</p>
							<ul class="list-disc px-4 text-sm">
								<li>{planDetails.metroRide1Stops} stops, {planDetails.metroRide1Time} minutes</li>
							</ul>
						</div>
					</div>

					{#if hasInterchange}
						<!-- Change lines at Majestic -->
						<div class="mb-4 flex items-start">
							<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
								<img src="/icons/sidebar-interchange.svg" alt="First ride" width="16" height="16" />
							</div>
							<div>
								<p>Change lines</p>
								<ul class="list-disc px-4 text-sm">
									<li>Alight at Kempegowda Majestic Metro Station</li>
									<li>
										{planDetails.interchangeColor} Line Platform {planDetails.metroRide2Platform}
									</li>
									<li>Towards {planDetails.metroRide2DirectionName}</li>
								</ul>
							</div>
						</div>

						<!-- Second Ride -->
						<div class="mb-4 flex items-start">
							<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
								<img src="/icons/sidebar-ride.svg" alt="Second ride" width="16" height="16" />
							</div>
							<div>
								<p>Ride</p>
								<ul class="list-disc px-4 text-sm">
									<li>{planDetails.metroRide2Stops} stops, {planDetails.metroRide2Time} minutes</li>
								</ul>
							</div>
						</div>
					{/if}

					<!-- Last Station -->
					<div class="mb-4 flex items-start">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
							<img src="/icons/sidebar-metro.svg" alt="Last station" width="16" height="16" />
						</div>
						<div>
							<p>{station2Name} Metro Station</p>
							<ul class="list-disc px-4 text-sm">
								<li>Get out of the train</li>
								<li>Gate {planDetails.metroRide2Ref}</li>
							</ul>
						</div>
					</div>

					<!-- Last Mile -->
					<div class="mb-4 flex items-start">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
							<img src="/icons/sidebar-first.svg" alt="Last mile" width="16" height="16" />
						</div>
						<div>
							<p>Last Mile</p>
							<ul class="list-disc px-4 text-sm">
								<li>
									Walk {planDetails.lastMileDistance >= 1000
										? (planDetails.lastMileDistance / 1000).toFixed(1) + ' km'
										: planDetails.lastMileDistance + 'm'} ({planDetails.lastMileTime} minutes)
								</li>
							</ul>
						</div>
					</div>

					<!-- Destination -->
					<div class="mb-4 flex items-start">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full text-xs">
							<img src="/icons/sidebar-destination.svg" alt="Destination" width="16" height="16" />
						</div>
						<div>
							<p>Destination</p>
							<ul class="list-disc px-4 text-sm">
								<li>{destination}</li>
							</ul>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Journey Planner Form -->
			<div class="p-6">
				<h1 class="mb-8 text-2xl sm:text-5xl">Metro map & journey planner</h1>

				<div class="space-y-8">
					<div class="mb-6">
						<slot name="originInput" />
					</div>

					<div class="mb-6">
						<slot name="destinationInput" />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
