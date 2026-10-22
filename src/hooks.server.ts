import type { ServerInit } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { getDb } from '#lib/server/db/index.ts';
import { migrateToLatest } from '#lib/server/db/migrate.ts';

/** Runs once, before the server handles its first request. */
export const init: ServerInit = async () => {
	if (building) return;
	await migrateToLatest(getDb());
};
