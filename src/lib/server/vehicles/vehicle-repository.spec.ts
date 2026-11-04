// Integration tests: these run against the `mileagemaster_test` database in the
// Docker container, so start it first with `npm run db:up`.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { createDb } from '../db/client.ts';
import { migrateToLatest } from '../db/migrate.ts';
import { createVehicleRepository, DuplicateLicencePlateError } from './vehicle-repository.ts';

const db = createDb({
	host: process.env.TEST_DB_HOST ?? 'localhost',
	port: Number(process.env.TEST_DB_PORT ?? 3306),
	database: process.env.TEST_DB_NAME ?? 'mileagemaster_test',
	user: process.env.TEST_DB_USER ?? 'mileagemaster',
	password: process.env.TEST_DB_PASSWORD ?? 'mileagemaster'
});
const vehicles = createVehicleRepository(db);

const car = { name: 'Family car', licencePlate: 'AB12 CDE', dateAcquired: '2020-05-01' };

beforeAll(async () => {
	await migrateToLatest(db);
});

beforeEach(async () => {
	await sql`TRUNCATE TABLE vehicle`.execute(db);
});

afterAll(async () => {
	await db.destroy();
});

describe('vehicle repository', () => {
	it('creates a vehicle and reads it back', async () => {
		const created = await vehicles.create(car);

		expect(created.id).toBeGreaterThan(0);
		expect(await vehicles.findById(created.id)).toEqual({ id: created.id, ...car });
	});

	it('rejects a duplicate licence plate, ignoring case and spacing', async () => {
		await vehicles.create(car);

		await expect(vehicles.create({ ...car, licencePlate: 'AB12CDE' })).rejects.toBeInstanceOf(
			DuplicateLicencePlateError
		);
		await expect(vehicles.create({ ...car, licencePlate: 'ab12 cde' })).rejects.toBeInstanceOf(
			DuplicateLicencePlateError
		);
	});

	it('updates a vehicle', async () => {
		const created = await vehicles.create(car);
		const changed = { ...created, name: 'Old banger', dateAcquired: '2019-01-31' };

		expect(await vehicles.update(changed)).toEqual(changed);
	});

	it('allows saving a vehicle without changing its plate', async () => {
		const created = await vehicles.create(car);

		expect(await vehicles.update(created)).toEqual(created);
	});

	it("rejects changing a plate to another vehicle's plate", async () => {
		await vehicles.create(car);
		const other = await vehicles.create({ ...car, licencePlate: 'XY99 ZZZ' });

		await expect(vehicles.update({ ...other, licencePlate: 'AB12 CDE' })).rejects.toBeInstanceOf(
			DuplicateLicencePlateError
		);
	});

	it('returns undefined when updating a vehicle that does not exist', async () => {
		expect(await vehicles.update({ id: 999_999, ...car })).toBeUndefined();
	});
});
