import React from 'react';
import { queryDb, safeQuery } from '@/lib/db';
import TripClient from './TripClient';
import { createTrip, dispatchTrip, completeTrip, cancelTrip } from './actions';
import { Route, Truck, Users, Activity } from 'lucide-react';

export default async function TripsPage() {
  const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
    safeQuery(`
      SELECT t.*, v.registration_number, v.vehicle_name, u.name as driver_name 
      FROM trip t 
      LEFT JOIN vehicle v ON t.vehicle_id = v.id 
      LEFT JOIN driver d ON t.driver_id = d.id 
      LEFT JOIN user u ON d.user_id = u.id
      ORDER BY t.created_at DESC
    `, [], []),
    safeQuery("SELECT id, registration_number, vehicle_name, capacity FROM vehicle WHERE status = 'AVAILABLE'", [], []),
    safeQuery("SELECT d.id, u.name, d.license_type FROM driver d JOIN user u ON d.user_id = u.id WHERE d.status = 'AVAILABLE'", [], [])
  ]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Route size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Fleet Dispatch & Trip Management</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                {(tripsRes || []).length} Trips
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create delivery orders, check vehicle capacity thresholds against cargo weights, verify driver licenses, and dispatch live trips.
            </p>
          </div>
        </div>
      </div>
      
      <TripClient 
        initialTrips={tripsRes || []} 
        availableVehicles={vehiclesRes || []} 
        availableDrivers={driversRes || []}
        createAction={createTrip}
        dispatchAction={dispatchTrip}
        completeAction={completeTrip}
        cancelAction={cancelTrip}
      />
    </div>
  );
}
