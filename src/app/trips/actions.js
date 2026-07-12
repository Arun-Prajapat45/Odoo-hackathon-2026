'use server';

import { queryDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createTrip(formData) {
  const tripNumber = 'TRP-' + Math.floor(Math.random() * 1000000);
  const vehicleId = formData.get('vehicleId');
  const driverId = formData.get('driverId');
  const source = formData.get('source');
  const destination = formData.get('destination');
  const cargoWeight = parseFloat(formData.get('cargoWeight'));
  
  // Note: in a real application, created_by would come from the auth session.
  const query = `
    INSERT INTO trip (trip_number, vehicle_id, driver_id, source, destination, cargo_weight, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', 1)
  `;
  
  await queryDb(query, [tripNumber, vehicleId, driverId, source, destination, cargoWeight]);
  revalidatePath('/trips');
  revalidatePath('/'); // update dashboard
}

export async function dispatchTrip(tripId, vehicleId, driverId, cargoWeight) {
  // 1. Check Vehicle
  const vRes = await queryDb("SELECT status, capacity FROM vehicle WHERE id = ?", [vehicleId]);
  const vehicle = vRes[0];
  if (!vehicle) throw new Error("Vehicle not found.");
  if (vehicle.status !== 'AVAILABLE') throw new Error(`Cannot dispatch: Vehicle is ${vehicle.status}.`);
  if (cargoWeight > vehicle.capacity) throw new Error(`Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.capacity}kg).`);

  // 2. Check Driver
  const dRes = await queryDb("SELECT status, license_expiry FROM driver WHERE id = ?", [driverId]);
  const driver = dRes[0];
  if (!driver) throw new Error("Driver not found.");
  if (driver.status === 'SUSPENDED') throw new Error("Cannot dispatch: Driver is SUSPENDED.");
  if (driver.status === 'ON_TRIP') throw new Error("Cannot dispatch: Driver is already ON_TRIP.");
  
  if (new Date(driver.license_expiry) < new Date()) {
    throw new Error("Cannot dispatch: Driver license is EXPIRED.");
  }

  // 3. Update trip, vehicle, driver
  await queryDb("UPDATE trip SET status = 'DISPATCHED', actual_start = CURRENT_TIMESTAMP WHERE id = ?", [tripId]);
  await queryDb("UPDATE vehicle SET status = 'ON_TRIP' WHERE id = ?", [vehicleId]);
  await queryDb("UPDATE driver SET status = 'ON_TRIP' WHERE id = ?", [driverId]);

  revalidatePath('/trips');
  revalidatePath('/');
}

export async function completeTrip(tripId, vehicleId, driverId) {
  await queryDb("UPDATE trip SET status = 'COMPLETED', actual_end = CURRENT_TIMESTAMP WHERE id = ?", [tripId]);
  await queryDb("UPDATE vehicle SET status = 'AVAILABLE' WHERE id = ?", [vehicleId]);
  await queryDb("UPDATE driver SET status = 'AVAILABLE' WHERE id = ?", [driverId]);

  revalidatePath('/trips');
  revalidatePath('/');
}

export async function cancelTrip(tripId, vehicleId, driverId) {
  await queryDb("UPDATE trip SET status = 'CANCELLED' WHERE id = ?", [tripId]);
  await queryDb("UPDATE vehicle SET status = 'AVAILABLE' WHERE id = ?", [vehicleId]);
  await queryDb("UPDATE driver SET status = 'AVAILABLE' WHERE id = ?", [driverId]);

  revalidatePath('/trips');
  revalidatePath('/');
}
