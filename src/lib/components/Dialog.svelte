<!--
@component
A modal popup. It opens when mounted, can be dragged by its title bar, and
closes on Escape, the close button, or a click outside its borders.
Render it conditionally: `{#if open}<Dialog onclose={() => (open = false)} />{/if}`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		onclose: () => void;
		children: Snippet;
	}

	let { title, onclose, children }: Props = $props();

	const titleId = `dialog-title-${Math.random().toString(36).slice(2)}`;

	let offset = $state({ x: 0, y: 0 });
	let pressedOnBackdrop = false;

	/** Lets the dialog be moved by dragging the element (its title bar) with a mouse or finger. */
	function dragHandle(handle: HTMLElement) {
		let start: { pointerX: number; pointerY: number; x: number; y: number } | null = null;

		function onDown(event: PointerEvent) {
			if ((event.target as HTMLElement).closest('button')) return;
			handle.setPointerCapture(event.pointerId);
			start = { pointerX: event.clientX, pointerY: event.clientY, ...offset };
		}

		function onMove(event: PointerEvent) {
			if (!start) return;
			offset = {
				x: start.x + event.clientX - start.pointerX,
				y: start.y + event.clientY - start.pointerY
			};
		}

		function onUp() {
			start = null;
		}

		handle.addEventListener('pointerdown', onDown);
		handle.addEventListener('pointermove', onMove);
		handle.addEventListener('pointerup', onUp);
		handle.addEventListener('pointercancel', onUp);

		return () => {
			handle.removeEventListener('pointerdown', onDown);
			handle.removeEventListener('pointermove', onMove);
			handle.removeEventListener('pointerup', onUp);
			handle.removeEventListener('pointercancel', onUp);
		};
	}

	// The <dialog> element itself only receives pointer events on its backdrop,
	// because the inner panel covers its whole box. Requiring both press and
	// release on the backdrop stops a drag that ends outside from closing it.
	function onBackdropPointerDown(event: PointerEvent) {
		pressedOnBackdrop = event.target === event.currentTarget;
	}

	function onBackdropClick(event: MouseEvent) {
		if (pressedOnBackdrop && event.target === event.currentTarget) onclose();
		pressedOnBackdrop = false;
	}
</script>

<dialog
	{@attach (dialog) => dialog.showModal()}
	aria-labelledby={titleId}
	class="m-auto w-[min(32rem,calc(100vw-2rem))] overflow-visible bg-transparent p-0 backdrop:bg-slate-900/40"
	style:translate="{offset.x}px {offset.y}px"
	onpointerdown={onBackdropPointerDown}
	onclick={onBackdropClick}
	oncancel={(event) => {
		event.preventDefault();
		onclose();
	}}
>
	<div class="overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
		<header
			class="flex cursor-move touch-none items-center justify-between gap-4 bg-brand-700 px-4 py-3 text-white select-none"
			{@attach dragHandle}
		>
			<h2 id={titleId} class="text-base font-semibold">{title}</h2>
			<button
				type="button"
				class="rounded p-1 leading-none hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
				aria-label="Close"
				onclick={onclose}
			>
				<span aria-hidden="true">&times;</span>
			</button>
		</header>
		<div class="p-4">
			{@render children()}
		</div>
	</div>
</dialog>
