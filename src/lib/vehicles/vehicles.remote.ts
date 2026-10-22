import { error, invalid } from '@sveltejs/kit';
import { form } from '$app/server';
import { getDb } from '#lib/server/db/index.ts';
import {
	createVehicleRepository,
	DuplicateLicencePlateError
} from '#lib/server/vehicles/vehicle-repository.ts';
import { messages, newVehicleSchema, vehicleUpdateSchema } from './vehicle.ts';

const vehicles = () => createVehicleRepository(getDb());

export const createVehicle = form(newVehicleSchema, async (data, issue) => {
	try {
		const vehicle = await vehicles().create(data);
		return { vehicle, message: messages.created };
	} catch (e) {
		if (e instanceof DuplicateLicencePlateError)
			invalid(issue.licencePlate(messages.duplicatePlate));
		throw e;
	}
});

export const updateVehicle = form(vehicleUpdateSchema, async (data, issue) => {
	try {
		const vehicle = await vehicles().update(data);
		if (!vehicle) error(404, 'Vehicle not found');
		return { vehicle, message: messages.updated };
	} catch (e) {
		if (e instanceof DuplicateLicencePlateError)
			invalid(issue.licencePlate(messages.duplicatePlate));
		throw e;
	}
});
