"use client";

import { useState } from 'react';
import { Plus, Play, CheckCircle, XCircle, X, Map } from 'lucide-react';

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

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

  const getStatusStyle = (status) => {
    const map = {
      DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
      DISPATCHED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
      COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
    };
    return map[status] || map.DRAFT;
  };

  return (
    <>
      <div className="bg-slate-900 rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center">
          <h2 className="font-semibold text-white">All Trips</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} /> New Trip
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trip ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo (kg)</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialTrips.map((trip) => (
                <tr key={trip.id} className="border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white font-mono text-xs">{trip.trip_number}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">{trip.registration_number}</td>
                  <td className="px-6 py-4 text-slate-300">{trip.driver_name}</td>
                  <td className="px-6 py-4 text-slate-300">{trip.source} → {trip.destination}</td>
                  <td className="px-6 py-4 text-slate-400">{trip.cargo_weight}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-1">
                    {trip.status === 'DRAFT' && (
                      <button onClick={() => handleDispatch(trip)} className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Dispatch">
                        <Play size={16} />
                      </button>
                    )}
                    {trip.status === 'DISPATCHED' && (
                      <button onClick={() => handleComplete(trip)} className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Complete">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
                      <button onClick={() => handleCancel(trip)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Cancel">
                        <XCircle size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {initialTrips.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <Map size={32} className="mx-auto mb-2 text-slate-600" />
                    No trips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-white">Create New Trip</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} />
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
              {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Vehicle</label><select name="vehicleId" required className={inputClass}><option value="">Select a vehicle...</option>{availableVehicles.map(v => (<option key={v.id} value={v.id}>{v.registration_number} (Cap: {v.capacity}kg)</option>))}</select></div>
                <div><label className={labelClass}>Driver</label><select name="driverId" required className={inputClass}><option value="">Select a driver...</option>{availableDrivers.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}</select></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Source</label><input type="text" name="source" required className={inputClass} placeholder="e.g. Warehouse A" /></div>
                <div><label className={labelClass}>Destination</label><input type="text" name="destination" required className={inputClass} placeholder="e.g. Store B" /></div>
              </div>

              <div><label className={labelClass}>Cargo Weight (kg)</label><input type="number" step="0.01" name="cargoWeight" required className={inputClass} placeholder="0.00" /></div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all shadow-lg shadow-blue-500/20">Create Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
