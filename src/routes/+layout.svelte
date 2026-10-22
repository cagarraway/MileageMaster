<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';
	import VehicleDialog from '#lib/vehicles/VehicleDialog.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let addingVehicle = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>MileageMaster</title>
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<header class="bg-brand-800 text-white shadow">
		<div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
			<a href={resolve('/')} class="text-lg font-semibold tracking-tight">MileageMaster</a>
			<nav aria-label="Main">
				<button
					type="button"
					class="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium ring-1 ring-white/20 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
					onclick={() => (addingVehicle = true)}
				>
					Add Vehicle
				</button>
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>

{#if addingVehicle}
	<VehicleDialog onclose={() => (addingVehicle = false)} />
{/if}
