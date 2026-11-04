import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

/** TypeScript description of the database tables, used by Kysely for type-safe queries. */
export interface Database {
	vehicle: VehicleTable;
}

export interface VehicleTable {
	id: Generated<number>;
	name: string;
	/** As entered (trimmed, uppercased), e.g. "AB12 CDE". */
	licence_plate: string;
	/** Plate with all whitespace removed; has a unique index, so "AB12 CDE" and "ab12cde" clash. */
	licence_plate_key: string;
	/** ISO date string, YYYY-MM-DD. */
	date_acquired: string;
	created_at: ColumnType<Date, never, never>;
	updated_at: ColumnType<Date, never, never>;
}

export type VehicleRow = Selectable<VehicleTable>;
export type NewVehicleRow = Insertable<VehicleTable>;
export type VehicleRowUpdate = Updateable<VehicleTable>;
