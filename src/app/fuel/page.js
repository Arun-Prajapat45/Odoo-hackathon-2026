import React from 'react';
import { queryDb, safeQuery } from '@/lib/db';
import FuelClient from './FuelClient';
import { createFuelLog } from './actions';
import { Droplet } from 'lucide-react';

export default async function FuelPage() {
  const [fuelRes, vehiclesRes] = await Promise.all([
    safeQuery(`
      SELECT f.*, v.registration_number, v.vehicle_name 
      FROM fuel_log f 
      LEFT JOIN vehicle v ON f.vehicle_id = v.id 
      ORDER BY f.date DESC, f.id DESC
    `, [], []),
    safeQuery("SELECT id, registration_number, vehicle_name, fuel_type FROM vehicle", [], [])
  ]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-cyan-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Droplet size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Fleet Fuel & Consumption Telemetry</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                {(fuelRes || []).length} Logs
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Log refueling receipts, monitor fleet mileage telemetry, calculate fuel expenditures, and audit consumption anomalies.
            </p>
          </div>
        </div>
      </div>
      
      <FuelClient 
        initialLogs={fuelRes || []} 
        vehicles={vehiclesRes || []} 
        createAction={createFuelLog}
      />
    </div>
  );
}
