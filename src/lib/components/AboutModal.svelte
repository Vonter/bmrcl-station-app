<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('close');
	}

	function handleOutsideClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleEscape} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
		on:click={handleOutsideClick}
		on:keydown={handleEscape}
		role="presentation"
	>
		<div
			class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
			role="dialog"
			aria-modal="true"
		>
			<div class="mb-4 flex justify-between">
				<h2 class="text-2xl font-medium">About</h2>
				<button
					class="text-gray-500 hover:text-gray-700"
					on:click={closeModal}
					aria-label="Close modal"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="space-y-4">
				<p>
					Metro map and journey planner helps you explore the Namma Metro map and plan your journey
					with ease.
				</p>

				<p>
					Vivek Matthew, Shamya Benehalli, Stuti Mehta, Puneet Sachdev, and Pravar Chaudhary helped
					build this.
				</p>

				<p>
					All the data is open source and the repository with code and data can be found <a
						href="https://github.com/Vonter/bmrcl-station-app"
						class="text-blue-600 hover:underline"
						target="_blank">here</a
					>. You may report bugs and send suggestions to
					<a href="mailto:hello@bengawalk.com" class="text-blue-600 hover:underline" target="_blank"
						>hello@bengawalk.com</a
					>.
				</p>

				<p class="pt-2 text-sm text-gray-600">
					A <a href="https://bengawalk.com" class="text-blue-600 hover:underline" target="_blank"
						>bengawalk</a
					> production
				</p>
			</div>
		</div>
	</div>
{/if}
