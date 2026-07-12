import { queryDb } from '@/lib/db';
import TripClient from './TripClient';
import { createTrip, dispatchTrip, completeTrip, cancelTrip } from './actions';

export default async function TripsPage() {
  const tripsRes = await queryDb(`
    SELECT t.*, v.registration_number, u.name as driver_name 
    FROM trip t 
    LEFT JOIN vehicle v ON t.vehicle_id = v.id 
    LEFT JOIN driver d ON t.driver_id = d.id 
    LEFT JOIN user u ON d.user_id = u.id
    ORDER BY t.created_at DESC
  `);
  
  const vehiclesRes = await queryDb("SELECT id, registration_number, capacity FROM vehicle WHERE status = 'AVAILABLE'");
  const driversRes = await queryDb("SELECT d.id, u.name FROM driver d JOIN user u ON d.user_id = u.id WHERE d.status = 'AVAILABLE'");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trip Management</h1>
        <p className="text-slate-400 text-sm mt-1">Dispatch, track, and complete delivery trips</p>
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
