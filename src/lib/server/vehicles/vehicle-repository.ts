import type { Kysely } from 'kysely';
import { licencePlateKey, type NewVehicle, type Vehicle } from '#lib/vehicles/vehicle.ts';
import type { Database, VehicleRow } from '../db/schema.ts';

/** Thrown when a vehicle's licence plate clashes with an existing vehicle's. */
export class DuplicateLicencePlateError extends Error {
	constructor() {
		super('Duplicate licence plate');
		this.name = 'DuplicateLicencePlateError';
	}
}

/** MySQL error 1062 (ER_DUP_ENTRY): a unique index was violated. */
function isDuplicateKeyError(error: unknown): boolean {
	return (error as { code?: string } | null)?.code === 'ER_DUP_ENTRY';
}

function toVehicle(row: VehicleRow): Vehicle {
	return {
		id: row.id,
		name: row.name,
		licencePlate: row.licence_plate,
		dateAcquired: row.date_acquired
	};
}

export function createVehicleRepository(db: Kysely<Database>) {
	return {
		async findById(id: number): Promise<Vehicle | undefined> {
			const row = await db
				.selectFrom('vehicle')
				.selectAll()
				.where('id', '=', id)
				.executeTakeFirst();
			return row && toVehicle(row);
		},

		/**
		 * Inserts a vehicle. The unique index on `licence_plate_key` enforces the
		 * no-duplicate-plates rule, even if two requests arrive at once.
		 */
		async create(vehicle: NewVehicle): Promise<Vehicle> {
			try {
				const result = await db
					.insertInto('vehicle')
					.values({
						name: vehicle.name,
						licence_plate: vehicle.licencePlate,
						licence_plate_key: licencePlateKey(vehicle.licencePlate),
						date_acquired: vehicle.dateAcquired
					})
					.executeTakeFirstOrThrow();
				return { id: Number(result.insertId), ...vehicle };
			} catch (error) {
				if (isDuplicateKeyError(error)) throw new DuplicateLicencePlateError();
				throw error;
			}
		},

		/** Updates a vehicle. Returns undefined if it doesn't exist. */
		async update(vehicle: Vehicle): Promise<Vehicle | undefined> {
			try {
				await db
					.updateTable('vehicle')
					.set({
						name: vehicle.name,
						licence_plate: vehicle.licencePlate,
						licence_plate_key: licencePlateKey(vehicle.licencePlate),
						date_acquired: vehicle.dateAcquired
					})
					.where('id', '=', vehicle.id)
					.execute();
			} catch (error) {
				if (isDuplicateKeyError(error)) throw new DuplicateLicencePlateError();
				throw error;
			}
			// MySQL reports 0 affected rows when nothing changed, so check existence explicitly.
			return this.findById(vehicle.id);
		}
	};
}

export type VehicleRepository = ReturnType<typeof createVehicleRepository>;
