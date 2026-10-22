import type { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';

/**
 * Supplies migrations from `./migrations/*.ts`, bundled into the build via
 * `import.meta.glob`. Kysely's FileMigrationProvider reads a folder at runtime
 * instead, which breaks when the build output is deployed without that folder.
 *
 * Migrations run in filename order, so prefix new files with the next number
 * (e.g. `0002_add_mileage_reading.ts`). Never edit a migration that has been deployed.
 */
const bundledMigrations: MigrationProvider = {
	async getMigrations() {
		const modules = import.meta.glob<Migration>('./migrations/*.ts', { eager: true });
		return Object.fromEntries(
			Object.entries(modules).map(([path, migration]) => [
				path.replace(/^.*\//, '').replace(/\.ts$/, ''),
				migration
			])
		);
	}
};

/** Applies any pending migrations. Throws if a migration fails. */
export async function migrateToLatest<DB>(db: Kysely<DB>): Promise<void> {
	const { error, results } = await new Migrator({
		db,
		provider: bundledMigrations
	}).migrateToLatest();

	for (const result of results ?? []) {
		if (result.status === 'Success') {
			console.log(`[db] applied migration ${result.migrationName}`);
		} else if (result.status === 'Error') {
			console.error(`[db] migration ${result.migrationName} failed`);
		}
	}

	if (error) throw error;
}
