import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import * as v from 'valibot';

// Database settings are only needed at runtime, not while building.
const required = building ? v.optional(v.string()) : v.pipe(v.string(), v.nonEmpty());

export const variables = defineEnvVars({
	DB_HOST: { description: 'MySQL host name', schema: required },
	DB_PORT: {
		description: 'MySQL port (defaults to 3306)',
		schema: v.optional(v.string(), '3306')
	},
	DB_NAME: { description: 'MySQL database name', schema: required },
	DB_USER: { description: 'MySQL user name', schema: required },
	DB_PASSWORD: { description: 'MySQL password', schema: required }
});
