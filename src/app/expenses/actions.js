"use server";

import { queryDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createExpense(formData) {
  const vehicleId = formData.get('vehicleId');
  const type = formData.get('type');
  const amount = parseFloat(formData.get('amount'));
  const remarks = formData.get('remarks');
  const date = formData.get('date');
  
  const query = `
    INSERT INTO expense (vehicle_id, type, amount, remarks, date)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  await queryDb(query, [vehicleId, type, amount, remarks, date]);
  revalidatePath('/expenses');
  revalidatePath('/'); // update dashboard
}
