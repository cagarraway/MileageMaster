import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from '$app/env/private';
import type { Kysely } from 'kysely';
import { createDb } from './client.ts';
import type { Database } from './schema.ts';

let instance: Kysely<Database> | undefined;

/** The app's shared database connection, configured from environment variables. */
export function getDb(): Kysely<Database> {
	instance ??= createDb({
		host: DB_HOST!,
		port: Number(DB_PORT),
		database: DB_NAME!,
		user: DB_USER!,
		password: DB_PASSWORD!
	});
	return instance;
}
