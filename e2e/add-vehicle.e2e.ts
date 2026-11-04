// UI tests for issue #2 (Add vehicle). Requires the Docker database: `npm run db:up`.
import { expect, test, type Locator, type Page } from '@playwright/test';

/** A licence plate no other test run will have used. */
function uniquePlate() {
	return `T${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
		.toUpperCase()
		.slice(0, 15);
}

async function openAddVehicle(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Add Vehicle' }).click();
	await expect(page.getByRole('dialog', { name: 'Add vehicle' })).toBeVisible();
	// Located by role only: the title changes to "Edit vehicle" after a save.
	return page.getByRole('dialog');
}

/** Fills in and submits the add-vehicle form inside `dialog`. */
async function addVehicle(dialog: Locator, vehicle: { name: string; plate: string; date: string }) {
	await dialog.getByLabel('Name').fill(vehicle.name);
	await dialog.getByLabel('Licence plate').fill(vehicle.plate);
	await dialog.getByLabel('Date acquired').fill(vehicle.date);
	await dialog.getByRole('button', { name: 'Add vehicle' }).click();
}

test('adds a vehicle, then shows it in edit mode', async ({ page }) => {
	const plate = uniquePlate();
	await addVehicle(await openAddVehicle(page), {
		name: 'Family car',
		plate: plate.toLowerCase(),
		date: '2020-05-01'
	});

	const dialog = page.getByRole('dialog', { name: 'Edit vehicle' });
	await expect(dialog.getByRole('status')).toHaveText('The vehicle has been created');
	await expect(dialog.getByLabel('Name')).toHaveValue('Family car');
	await expect(dialog.getByLabel('Licence plate')).toHaveValue(plate);
	await expect(dialog.getByLabel('Date acquired')).toHaveValue('2020-05-01');
});

test('saves changes in edit mode', async ({ page }) => {
	const dialog = await openAddVehicle(page);
	await addVehicle(dialog, { name: 'Family car', plate: uniquePlate(), date: '2020-05-01' });
	await expect(dialog.getByRole('status')).toHaveText('The vehicle has been created');

	await dialog.getByLabel('Name').fill('Old banger');
	await dialog.getByRole('button', { name: 'Save changes' }).click();

	await expect(dialog.getByRole('status')).toHaveText('The vehicle has been updated');
	await expect(dialog.getByLabel('Name')).toHaveValue('Old banger');
});

test('stops a duplicate licence plate, ignoring case and spaces', async ({ page }) => {
	const plate = uniquePlate();
	const first = await openAddVehicle(page);
	await addVehicle(first, { name: 'First', plate, date: '2020-05-01' });
	await expect(first.getByRole('status')).toHaveText('The vehicle has been created');
	await page.keyboard.press('Escape');
	await expect(first).toBeHidden();

	const second = await openAddVehicle(page);
	await addVehicle(second, {
		name: 'Second',
		plate: `${plate.slice(0, 4)} ${plate.slice(4)}`.toLowerCase(),
		date: '2020-05-01'
	});

	await expect(second.getByText('A duplicate licence plate already exists.')).toBeVisible();
	await expect(second).toBeVisible();
});

test('rejects a date acquired in the future', async ({ page }) => {
	const dialog = await openAddVehicle(page);
	await addVehicle(dialog, { name: 'Time machine', plate: uniquePlate(), date: '2999-01-01' });

	await expect(dialog.getByText('The Date Acquired cannot be in the future')).toBeVisible();
	await expect(dialog).toBeVisible();
});

test('closes when clicking outside the dialog', async ({ page }) => {
	const dialog = await openAddVehicle(page);

	await page.mouse.click(5, 5);

	await expect(dialog).toBeHidden();
});

test('can be moved by dragging its title bar', async ({ page }) => {
	const dialog = await openAddVehicle(page);
	const before = (await dialog.boundingBox())!;
	const title = (await dialog.getByRole('heading', { name: 'Add vehicle' }).boundingBox())!;

	await page.mouse.move(title.x + 5, title.y + 5);
	await page.mouse.down();
	await page.mouse.move(title.x + 105, title.y + 55, { steps: 5 });
	await page.mouse.up();

	const after = (await dialog.boundingBox())!;
	expect(after.x - before.x).toBeCloseTo(100, 0);
	expect(after.y - before.y).toBeCloseTo(50, 0);
	await expect(dialog).toBeVisible();
});
