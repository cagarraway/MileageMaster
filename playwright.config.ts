import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		// UI tests use the test database (see docker-compose.yml), never the dev one.
		env: { DB_NAME: process.env.TEST_DB_NAME ?? 'mileagemaster_test' }
	}
});
