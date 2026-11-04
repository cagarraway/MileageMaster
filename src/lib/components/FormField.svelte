<!--
@component
A labelled form control with its validation messages underneath.
Pass the input as children; `issues` comes from a remote form field's `issues()`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		issues?: { message: string }[];
		children: Snippet;
	}

	let { label, issues, children }: Props = $props();
</script>

<label class="block">
	<span class="mb-1 block text-sm font-medium text-slate-700">{label}</span>
	{@render children()}
</label>
{#each issues ?? [] as issue (issue.message)}
	<p class="mt-1 text-sm text-red-700">{issue.message}</p>
{/each}
