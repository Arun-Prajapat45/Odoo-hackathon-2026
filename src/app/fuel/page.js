import { executeQuery } from '../../lib/db';
import FuelClient from './FuelClient';
import { createFuelLog } from './actions';

export default async function FuelPage() {
  const fuelRes = await executeQuery(`
    SELECT f.*, v.registration_number 
    FROM fuel_log f 
    LEFT JOIN vehicle v ON f.vehicle_id = v.id 
    ORDER BY f.date DESC, f.id DESC
  `);
  
  const vehiclesRes = await executeQuery("SELECT id, registration_number FROM vehicle");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Fuel Logs</h1>
      </div>
      
      <FuelClient 
        initialLogs={fuelRes?.data || []} 
        vehicles={vehiclesRes?.data || []} 
        createAction={createFuelLog}
      />
    </div>
  );
}
