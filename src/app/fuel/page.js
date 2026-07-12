import { queryDb } from '@/lib/db';
import FuelClient from './FuelClient';
import { createFuelLog } from './actions';

export default async function FuelPage() {
  const fuelRes = await queryDb(`
    SELECT f.*, v.registration_number 
    FROM fuel_log f 
    LEFT JOIN vehicle v ON f.vehicle_id = v.id 
    ORDER BY f.date DESC, f.id DESC
  `);
  
  const vehiclesRes = await queryDb("SELECT id, registration_number FROM vehicle");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fuel Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Track fuel consumption and costs across the fleet</p>
      </div>
      
      <FuelClient 
        initialLogs={fuelRes || []} 
        vehicles={vehiclesRes || []} 
        createAction={createFuelLog}
      />
    </div>
  );
}
