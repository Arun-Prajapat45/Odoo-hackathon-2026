import { executeQuery } from '../../lib/db';
import TripClient from './TripClient';
import { createTrip, dispatchTrip, completeTrip, cancelTrip } from './actions';

export default async function TripsPage() {
  // Fetch trips and related info
  const tripsRes = await executeQuery(`
    SELECT t.*, v.registration_number, u.name as driver_name 
    FROM trip t 
    LEFT JOIN vehicle v ON t.vehicle_id = v.id 
    LEFT JOIN driver d ON t.driver_id = d.id 
    LEFT JOIN user u ON d.user_id = u.id
    ORDER BY t.created_at DESC
  `);
  
  // Fetch available vehicles and drivers for creating trips
  const vehiclesRes = await executeQuery("SELECT id, registration_number, capacity FROM vehicle WHERE status = 'AVAILABLE'");
  const driversRes = await executeQuery("SELECT d.id, u.name FROM driver d JOIN user u ON d.user_id = u.id WHERE d.status = 'AVAILABLE'");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Trip Management</h1>
      </div>
      
      <TripClient 
        initialTrips={tripsRes?.data || []} 
        availableVehicles={vehiclesRes?.data || []} 
        availableDrivers={driversRes?.data || []}
        createAction={createTrip}
        dispatchAction={dispatchTrip}
        completeAction={completeTrip}
        cancelAction={cancelTrip}
      />
    </div>
  );
}
