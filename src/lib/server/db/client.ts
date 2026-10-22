import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import type { Database } from './schema.ts';

export interface DbConfig {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
}

/**
 * Creates a Kysely instance backed by a mysql2 connection pool.
 * Kept free of SvelteKit imports so tests can create their own connection.
 */
export function createDb(config: DbConfig): Kysely<Database> {
	return new Kysely<Database>({
		dialect: new MysqlDialect({
			pool: createPool({
				...config,
				connectionLimit: 5,
				// Return DATE columns as 'YYYY-MM-DD' strings rather than JS Dates,
				// avoiding timezone shifts on date-only values.
				dateStrings: ['DATE']
			})
		})
	});
}
