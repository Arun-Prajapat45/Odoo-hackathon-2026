"use server";

import { executeQuery } from '../../lib/db';
import { revalidatePath } from 'next/cache';

export async function createFuelLog(formData) {
  const vehicleId = formData.get('vehicleId');
  const liters = parseFloat(formData.get('liters'));
  const pricePerLiter = parseFloat(formData.get('pricePerLiter'));
  const odometer = parseFloat(formData.get('odometer')) || null;
  const date = formData.get('date');
  const totalCost = liters * pricePerLiter;
  
  const query = `
    INSERT INTO fuel_log (vehicle_id, liters, price_per_liter, total_cost, odometer, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  await executeQuery(query, [vehicleId, liters, pricePerLiter, totalCost, odometer, date]);
  revalidatePath('/fuel');
  revalidatePath('/'); // update dashboard
}
