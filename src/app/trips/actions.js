"use server";

import { executeQuery } from '../../lib/db';
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
  
  await executeQuery(query, [tripNumber, vehicleId, driverId, source, destination, cargoWeight]);
  revalidatePath('/trips');
  revalidatePath('/'); // update dashboard
}

export async function dispatchTrip(tripId, vehicleId, driverId, cargoWeight) {
  // Check vehicle capacity
  const vRes = await executeQuery("SELECT capacity FROM vehicle WHERE id = ?", [vehicleId]);
  const capacity = vRes?.data?.[0]?.capacity;
  if (capacity && cargoWeight > capacity) {
    throw new Error(`Cargo weight (${cargoWeight}) exceeds vehicle capacity (${capacity})`);
  }

  // Update trip, vehicle, driver
  await executeQuery("UPDATE trip SET status = 'DISPATCHED', actual_start = CURRENT_TIMESTAMP WHERE id = ?", [tripId]);
  await executeQuery("UPDATE vehicle SET status = 'ON_TRIP' WHERE id = ?", [vehicleId]);
  await executeQuery("UPDATE driver SET status = 'ON_TRIP' WHERE id = ?", [driverId]);

  revalidatePath('/trips');
  revalidatePath('/');
}

export async function completeTrip(tripId, vehicleId, driverId) {
  await executeQuery("UPDATE trip SET status = 'COMPLETED', actual_end = CURRENT_TIMESTAMP WHERE id = ?", [tripId]);
  await executeQuery("UPDATE vehicle SET status = 'AVAILABLE' WHERE id = ?", [vehicleId]);
  await executeQuery("UPDATE driver SET status = 'AVAILABLE' WHERE id = ?", [driverId]);

  revalidatePath('/trips');
  revalidatePath('/');
}

export async function cancelTrip(tripId, vehicleId, driverId) {
  await executeQuery("UPDATE trip SET status = 'CANCELLED' WHERE id = ?", [tripId]);
  await executeQuery("UPDATE vehicle SET status = 'AVAILABLE' WHERE id = ?", [vehicleId]);
  await executeQuery("UPDATE driver SET status = 'AVAILABLE' WHERE id = ?", [driverId]);

  revalidatePath('/trips');
  revalidatePath('/');
}
