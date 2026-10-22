import * as v from 'valibot';

/** User-facing messages defined by the requirements (issue #2). */
export const messages = {
	created: 'The vehicle has been created',
	updated: 'The vehicle has been updated',
	duplicatePlate: 'A duplicate licence plate already exists.',
	futureDate: 'The Date Acquired cannot be in the future'
} as const;

export const NAME_MAX_LENGTH = 100;
export const LICENCE_PLATE_MAX_LENGTH = 15;

/** Trims, uppercases and collapses internal whitespace: " ab12  cde " -> "AB12 CDE". */
export function normaliseLicencePlate(plate: string): string {
	return plate.trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Key used for duplicate detection; ignores spaces: "AB12 CDE" -> "AB12CDE". */
export function licencePlateKey(plate: string): string {
	return normaliseLicencePlate(plate).replace(/ /g, '');
}

/**
 * Today's date as YYYY-MM-DD in the server's local timezone.
 * Set the `TZ` environment variable on the host (e.g. `TZ=Europe/London`) so
 * "today" matches the users' calendar.
 */
export function todayIso(now = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** True if an ISO date (YYYY-MM-DD) is after `today`. ISO dates compare correctly as strings. */
export function isFutureDate(isoDate: string, today = todayIso()): boolean {
	return isoDate > today;
}

/** Reports only a field's first problem (e.g. "required", not also "invalid date"). */
function firstIssueOnly<T extends v.GenericSchema>(schema: T): T {
	return v.config(schema, { abortPipeEarly: true });
}

/** Field rules shared by the create and edit forms. */
export const vehicleFields = {
	name: firstIssueOnly(
		v.pipe(
			v.string(),
			v.trim(),
			v.nonEmpty('Name is required'),
			v.maxLength(NAME_MAX_LENGTH, `Name cannot be longer than ${NAME_MAX_LENGTH} characters`)
		)
	),
	licencePlate: firstIssueOnly(
		v.pipe(
			v.string(),
			v.transform(normaliseLicencePlate),
			v.nonEmpty('Licence plate is required'),
			v.maxLength(
				LICENCE_PLATE_MAX_LENGTH,
				`Licence plate cannot be longer than ${LICENCE_PLATE_MAX_LENGTH} characters`
			)
		)
	),
	dateAcquired: firstIssueOnly(
		v.pipe(
			v.string(),
			v.nonEmpty('Date acquired is required'),
			v.isoDate('Date acquired must be a valid date'),
			v.check((date) => !isFutureDate(date), messages.futureDate)
		)
	)
};

export const newVehicleSchema = v.object(vehicleFields);

export const vehicleUpdateSchema = v.object({
	id: v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1)),
	...vehicleFields
});

export type NewVehicle = v.InferOutput<typeof newVehicleSchema>;

export interface Vehicle extends NewVehicle {
	id: number;
}
