import { writable } from 'svelte/store';

interface Location {
	name: string;
	coordinates: [number, number];
}

interface JourneyState {
	origin: Location | null;
	destination: Location | null;
	stations: string[];
	walkingTimes: {
		toFirstStation: number;
		fromLastStation: number;
	};
}

const createJourneyStore = () => {
	const { subscribe, set, update } = writable<JourneyState>({
		origin: null,
		destination: null,
		stations: [],
		walkingTimes: {
			toFirstStation: 0,
			fromLastStation: 0
		}
	});

	return {
		subscribe,
		setLocations: (origin: Location | null, destination: Location | null) => {
			update((state) => ({
				...state,
				origin,
				destination
			}));
		},
		reset: () => {
			set({
				origin: null,
				destination: null,
				stations: [],
				walkingTimes: {
					toFirstStation: 0,
					fromLastStation: 0
				}
			});
		}
	};
};

export const journeyStore = createJourneyStore();
