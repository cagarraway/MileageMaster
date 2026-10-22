import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	isFutureDate,
	licencePlateKey,
	messages,
	newVehicleSchema,
	normaliseLicencePlate,
	todayIso,
	vehicleUpdateSchema
} from './vehicle.ts';

const valid = { name: 'Family car', licencePlate: 'ab12 cde', dateAcquired: '2020-05-01' };

function issuesFor(input: Record<string, unknown>) {
	const result = v.safeParse(newVehicleSchema, input);
	return result.success ? [] : result.issues.map((issue) => issue.message);
}

describe('normaliseLicencePlate', () => {
	it('trims, uppercases and collapses whitespace', () => {
		expect(normaliseLicencePlate('  ab12   cde ')).toBe('AB12 CDE');
	});
});

describe('licencePlateKey', () => {
	it('treats plates differing only by case or spacing as the same', () => {
		expect(licencePlateKey('ab12 cde')).toBe('AB12CDE');
		expect(licencePlateKey('AB12CDE')).toBe(licencePlateKey(' a b 1 2 c d e '));
	});
});

describe('todayIso', () => {
	it('formats a local date as YYYY-MM-DD', () => {
		expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
	});
});

describe('isFutureDate', () => {
	it('allows today and past dates', () => {
		expect(isFutureDate('2026-10-22', '2026-10-22')).toBe(false);
		expect(isFutureDate('2026-10-21', '2026-10-22')).toBe(false);
	});

	it('rejects dates after today', () => {
		expect(isFutureDate('2026-10-23', '2026-10-22')).toBe(true);
		expect(isFutureDate('2027-01-01', '2026-12-31')).toBe(true);
	});
});

describe('newVehicleSchema', () => {
	it('accepts a valid vehicle and normalises its plate and name', () => {
		const result = v.parse(newVehicleSchema, { ...valid, name: '  Family car ' });
		expect(result).toEqual({
			name: 'Family car',
			licencePlate: 'AB12 CDE',
			dateAcquired: '2020-05-01'
		});
	});

	it("accepts today's date", () => {
		expect(issuesFor({ ...valid, dateAcquired: todayIso() })).toEqual([]);
	});

	it('rejects a future date acquired with the required message', () => {
		expect(issuesFor({ ...valid, dateAcquired: '2999-01-01' })).toEqual([messages.futureDate]);
	});

	it('requires every field', () => {
		expect(issuesFor({ name: ' ', licencePlate: '', dateAcquired: '' })).toEqual([
			'Name is required',
			'Licence plate is required',
			'Date acquired is required'
		]);
	});

	it('rejects invalid dates', () => {
		expect(issuesFor({ ...valid, dateAcquired: '2020-13-45' })).toEqual([
			'Date acquired must be a valid date'
		]);
	});

	it('enforces maximum lengths', () => {
		expect(issuesFor({ ...valid, name: 'x'.repeat(101), licencePlate: 'X'.repeat(16) })).toEqual([
			'Name cannot be longer than 100 characters',
			'Licence plate cannot be longer than 15 characters'
		]);
	});
});

describe('vehicleUpdateSchema', () => {
	it('converts the id from the form to a number', () => {
		expect(v.parse(vehicleUpdateSchema, { ...valid, id: '42' }).id).toBe(42);
	});

	it('rejects a missing or invalid id', () => {
		expect(v.safeParse(vehicleUpdateSchema, { ...valid, id: 'abc' }).success).toBe(false);
		expect(v.safeParse(vehicleUpdateSchema, { ...valid, id: '0' }).success).toBe(false);
	});
});
