import { sql, type Kysely } from 'kysely';

// Migrations receive an untyped Kysely: they describe the schema at a point in time,
// so they must not depend on the current `Database` type.
export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('vehicle')
		.addColumn('id', 'integer', (col) => col.unsigned().autoIncrement().primaryKey())
		.addColumn('name', 'varchar(100)', (col) => col.notNull())
		.addColumn('licence_plate', 'varchar(15)', (col) => col.notNull())
		.addColumn('licence_plate_key', 'varchar(15)', (col) => col.notNull().unique())
		.addColumn('date_acquired', 'date', (col) => col.notNull())
		.addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('updated_at', 'timestamp', (col) =>
			col
				.notNull()
				.defaultTo(sql`CURRENT_TIMESTAMP`)
				.modifyEnd(sql`ON UPDATE CURRENT_TIMESTAMP`)
		)
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable('vehicle').execute();
}
