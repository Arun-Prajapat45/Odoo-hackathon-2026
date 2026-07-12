"use client";

import { useState } from 'react';
import { Plus, Play, CheckCircle, XCircle } from 'lucide-react';

export default function TripClient({ initialTrips, availableVehicles, availableDrivers, createAction, dispatchAction, completeAction, cancelAction }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleDispatch = async (trip) => {
    try {
      await dispatchAction(trip.id, trip.vehicle_id, trip.driver_id, trip.cargo_weight);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComplete = async (trip) => {
    try {
      await completeAction(trip.id, trip.vehicle_id, trip.driver_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (trip) => {
    try {
      await cancelAction(trip.id, trip.vehicle_id, trip.driver_id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">All Trips</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Trip
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Trip ID</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Cargo (kg)</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {initialTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{trip.trip_number}</td>
                  <td className="px-6 py-4">{trip.registration_number}</td>
                  <td className="px-6 py-4">{trip.driver_name}</td>
                  <td className="px-6 py-4">{trip.source} &rarr; {trip.destination}</td>
                  <td className="px-6 py-4">{trip.cargo_weight}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      trip.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                      trip.status === 'DISPATCHED' ? 'bg-indigo-100 text-indigo-600' :
                      trip.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {trip.status === 'DRAFT' && (
                      <button onClick={() => handleDispatch(trip)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Dispatch">
                        <Play size={18} />
                      </button>
                    )}
                    {trip.status === 'DISPATCHED' && (
                      <button onClick={() => handleComplete(trip)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Complete">
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
                      <button onClick={() => handleCancel(trip)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Cancel">
                        <XCircle size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {initialTrips.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">No trips found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-800">Create New Trip</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>
            
            <form action={async (formData) => {
              try {
                await createAction(formData);
                setIsModalOpen(false);
              } catch (err) {
                setError(err.message);
              }
            }} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                  <select name="vehicleId" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select a vehicle...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} (Cap: {v.capacity}kg)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver</label>
                  <select name="driverId" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select a driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                  <input type="text" name="source" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Warehouse A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                  <input type="text" name="destination" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Store B" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo Weight (kg)</label>
                <input type="number" step="0.01" name="cargoWeight" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
