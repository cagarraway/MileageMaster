<!--
@component
Popup for adding a vehicle. After a successful save it switches to edit mode
for the new record and shows a confirmation message (issue #2).
-->
<script lang="ts">
	import Dialog from '#lib/components/Dialog.svelte';
	import FormField from '#lib/components/FormField.svelte';
	import { LICENCE_PLATE_MAX_LENGTH, NAME_MAX_LENGTH, type Vehicle } from './vehicle.ts';
	import { createVehicle, updateVehicle } from './vehicles.remote.ts';

	let { onclose }: { onclose: () => void } = $props();

	// Each time the dialog opens it gets fresh form instances, so values and
	// messages from a previous visit don't reappear.
	const key = $props.id();
	const create = createVehicle.for(key);
	const update = updateVehicle.for(key);

	/** Set once the vehicle has been created; switches the dialog to edit mode. */
	let vehicle = $state<Vehicle | null>(null);
	let message = $state('');

	const inputClass =
		'block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 aria-invalid:border-red-500';
	const buttonClass =
		'rounded-md bg-brand-700 px-4 py-2 font-medium text-white shadow-sm hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60';
	const secondaryButtonClass =
		'rounded-md px-4 py-2 font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50';
</script>

<Dialog title={vehicle ? 'Edit vehicle' : 'Add vehicle'} {onclose}>
	{#if message}
		<p
			role="status"
			class="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800 ring-1 ring-brand-200"
		>
			{message}
		</p>
	{/if}

	{#if !vehicle}
		<form
			class="space-y-4"
			{...create.enhance(async (form) => {
				if ((await form.submit()) && create.result) {
					vehicle = create.result.vehicle;
					message = create.result.message;
				}
			})}
		>
			<div>
				<FormField label="Name" issues={create.fields.name.issues()}>
					<input
						{...create.fields.name.as('text')}
						maxlength={NAME_MAX_LENGTH}
						required
						class={inputClass}
					/>
				</FormField>
			</div>
			<div>
				<FormField label="Licence plate" issues={create.fields.licencePlate.issues()}>
					<input
						{...create.fields.licencePlate.as('text')}
						maxlength={LICENCE_PLATE_MAX_LENGTH}
						required
						autocapitalize="characters"
						class="{inputClass} uppercase"
					/>
				</FormField>
			</div>
			<div>
				<FormField label="Date acquired" issues={create.fields.dateAcquired.issues()}>
					<input {...create.fields.dateAcquired.as('date')} required class={inputClass} />
				</FormField>
			</div>
			<div class="flex justify-end gap-2">
				<button type="button" class={secondaryButtonClass} onclick={onclose}>Cancel</button>
				<button class={buttonClass} disabled={!!create.pending}>Add vehicle</button>
			</div>
		</form>
	{:else}
		<form
			class="space-y-4"
			{...update.enhance(async (form) => {
				message = '';
				if ((await form.submit()) && update.result) {
					vehicle = update.result.vehicle;
					message = update.result.message;
				}
			})}
		>
			<input {...update.fields.id.as('hidden', String(vehicle.id))} />
			<div>
				<FormField label="Name" issues={update.fields.name.issues()}>
					<input
						{...update.fields.name.as('text', vehicle.name)}
						maxlength={NAME_MAX_LENGTH}
						required
						class={inputClass}
					/>
				</FormField>
			</div>
			<div>
				<FormField label="Licence plate" issues={update.fields.licencePlate.issues()}>
					<input
						{...update.fields.licencePlate.as('text', vehicle.licencePlate)}
						maxlength={LICENCE_PLATE_MAX_LENGTH}
						required
						autocapitalize="characters"
						class="{inputClass} uppercase"
					/>
				</FormField>
			</div>
			<div>
				<FormField label="Date acquired" issues={update.fields.dateAcquired.issues()}>
					<input
						{...update.fields.dateAcquired.as('date', vehicle.dateAcquired)}
						required
						class={inputClass}
					/>
				</FormField>
			</div>
			<div class="flex justify-end gap-2">
				<button type="button" class={secondaryButtonClass} onclick={onclose}>Close</button>
				<button class={buttonClass} disabled={!!update.pending}>Save changes</button>
			</div>
		</form>
	{/if}
</Dialog>
