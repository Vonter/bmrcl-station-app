declare namespace google {
	namespace maps {
		namespace places {
			interface AutocompleteOptions {
				types?: string[];
				fields?: string[];
				componentRestrictions?: {
					country: string;
				};
				strictBounds?: boolean;
			}
			class Autocomplete {
				constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
				addListener(eventName: string, handler: () => void): void;
				getPlace(): {
					formatted_address?: string;
					geometry?: object;
					name?: string;
				};
			}
		}
	}
}
