<script lang="ts">
	import '../app.css';

	import Analytics from '$lib/components/Analytics.svelte';
	import SEO from '$lib/components/SEO.svelte';

	let { children } = $props();
</script>

<main class="h-full w-full font-sans">
	{@render children()}
</main>
<Analytics />
<SEO />
