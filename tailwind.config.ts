import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif']
			}
		}
	},

	plugins: []
} satisfies Config;
