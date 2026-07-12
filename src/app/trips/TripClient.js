"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import ManifestRail from '@/components/ManifestRail';
import {
  Plus,
  Play,
  CheckCircle,
  XCircle,
  X,
  Map,
  Search,
  Truck,
  Users,
  Route,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function TripClient({
  initialTrips = [],
  availableVehicles = [],
  availableDrivers = [],
  createAction,
  dispatchAction,
  completeAction,
  cancelAction
}) {
  const [trips, setTrips] = useState(initialTrips);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = trips.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (t.trip_number && t.trip_number.toLowerCase().includes(q)) ||
      (t.source && t.source.toLowerCase().includes(q)) ||
      (t.destination && t.destination.toLowerCase().includes(q)) ||
      (t.registration_number && t.registration_number.toLowerCase().includes(q)) ||
      (t.driver_name && t.driver_name.toLowerCase().includes(q));
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    draft: trips.filter(t => t.status === 'DRAFT').length,
    dispatched: trips.filter(t => t.status === 'DISPATCHED').length,
    completed: trips.filter(t => t.status === 'COMPLETED').length,
    cancelled: trips.filter(t => t.status === 'CANCELLED').length,
  };

  const handleDispatch = async (trip) => {
    if (!confirm(`Dispatch trip ${trip.trip_number || trip.id}? Vehicle and driver will be locked to ON_TRIP.`)) return;
    setProcessingId(trip.id);
    try {
      await dispatchAction(trip.id, trip.vehicle_id, trip.driver_id, trip.cargo_weight || 0);
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'DISPATCHED' } : t));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (trip) => {
    if (!confirm(`Mark trip ${trip.trip_number || trip.id} as COMPLETED? Vehicle and driver will return to AVAILABLE.`)) return;
    setProcessingId(trip.id);
    try {
      await completeAction(trip.id, trip.vehicle_id, trip.driver_id);
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'COMPLETED' } : t));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (trip) => {
    if (!confirm(`Cancel trip ${trip.trip_number || trip.id}? Vehicle and driver will be released immediately.`)) return;
    setProcessingId(trip.id);
    try {
      await cancelAction(trip.id, trip.vehicle_id, trip.driver_id);
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'CANCELLED' } : t));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusStyle = (status) => {
    const map = {
      DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      DISPATCHED: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30 animate-pulse',
      COMPLETED: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
      CANCELLED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30',
    };
    return map[status] || map.DRAFT;
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Draft Orders</span>
          <p className="text-2xl font-extrabold mt-0.5 text-slate-800 dark:text-slate-200">{stats.draft}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Pending Dispatch</p>
        </div>
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Transit</span>
          <p className="text-2xl font-extrabold mt-0.5 text-indigo-600 dark:text-indigo-400">{stats.dispatched}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Active Deliveries</p>
        </div>
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <p className="text-2xl font-extrabold mt-0.5 text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Successful Trips</p>
        </div>
        <div className="glass-card p-4.5 flex flex-col justify-center items-end bg-gradient-to-br from-blue-600/10 to-indigo-600/10">
          <button
            onClick={() => { setIsModalOpen(true); setError(''); }}
            className="btn-primary w-full py-2.5 justify-center text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} />
            <span>Create New Trip Order</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search manifests by Trip ID, source, destination, vehicle REG, or driver name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 md:px-6">Trip Manifest #</th>
                <th className="py-3.5 px-4">Assigned Vehicle</th>
                <th className="py-3.5 px-4">Operator / Driver</th>
                <th className="py-3.5 px-4 min-w-[220px]">Route Manifest</th>
                <th className="py-3.5 px-4">Cargo Weight</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 md:px-6 text-right">Dispatch Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filtered.map((trip) => {
                const isProcessing = processingId === trip.id;
                return (
                  <tr key={trip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 md:px-6 font-mono font-bold text-xs">
                      <span className="text-blue-600 dark:text-blue-400">
                        {trip.trip_number || `TRIP-${trip.id}`}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {trip.created_at ? trip.created_at.split('T')[0] : 'Active Order'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      {trip.vehicle_id ? (
                        <Link href={`/vehicles/${trip.vehicle_id}`} className="font-mono text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                          <Truck size={14} className="text-slate-400 shrink-0" />
                          <span>{trip.registration_number || `UNIT-${trip.vehicle_id}`}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No Vehicle Assigned</span>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]">
                        {trip.vehicle_name || 'Standard Carrier'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      {trip.driver_id ? (
                        <Link href={`/drivers/${trip.driver_id}`} className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                          <Users size={14} className="text-slate-400 shrink-0" />
                          <span>{trip.driver_name || `DRIVER-${trip.driver_id}`}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No Driver Assigned</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <ManifestRail source={trip.source} destination={trip.destination} status={trip.status} />
                    </td>

                    <td className="py-4 px-4 font-bold text-xs text-slate-800 dark:text-slate-200">
                      {Number(trip.cargo_weight || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Tons</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase inline-flex items-center gap-1 ${getStatusStyle(trip.status)}`}>
                        {isProcessing && <Loader2 size={11} className="animate-spin" />}
                        <span>{trip.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 md:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {trip.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDispatch(trip)}
                            disabled={isProcessing}
                            className="btn-primary py-1 px-2.5 text-[11px] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                            title="Dispatch Trip Order"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Dispatch</span>
                          </button>
                        )}
                        {trip.status === 'DISPATCHED' && (
                          <button
                            onClick={() => handleComplete(trip)}
                            disabled={isProcessing}
                            className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all inline-flex items-center gap-1"
                            title="Complete Trip Delivery"
                          >
                            <CheckCircle size={13} />
                            <span>Complete</span>
                          </button>
                        )}
                        {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
                          <button
                            onClick={() => handleCancel(trip)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Cancel Order"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                    <Map size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No trip orders matching criteria</h3>
                    <p className="text-xs mt-1 text-slate-500">
                      {search || statusFilter ? 'Try clearing your search filters.' : 'Click "Create New Trip Order" above to initiate delivery dispatch.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New Trip Dispatch Manifest</h3>
                  <p className="text-xs text-slate-500">Assign carrier unit and operator for route delivery</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X size={18} />
              </button>
            </div>

            <form
              action={async (formData) => {
                setSubmitting(true);
                setError('');
                try {
                  await createAction(formData);
                  setIsModalOpen(false);
                } catch (err) {
                  setError(err.message);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Assign Carrier Vehicle *</label>
                  <select name="vehicleId" required className={inputClass}>
                    <option value="">Select Available Unit...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} ({v.vehicle_name || 'Unit'}) - Cap: {v.capacity || 0} Tons
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Assign Operator / Driver *</label>
                  <select name="driverId" required className={inputClass}>
                    <option value="">Select Available Driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.license_type || 'HMV'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Source Location *</label>
                  <input type="text" name="source" required className={inputClass} placeholder="e.g., Central Depot Hub A" />
                </div>
                <div>
                  <label className={labelClass}>Destination Point *</label>
                  <input type="text" name="destination" required className={inputClass} placeholder="e.g., Regional Distribution B" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Cargo Load Weight (in Tons) *</label>
                <input type="number" step="0.01" name="cargoWeight" required className={inputClass} placeholder="0.00" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-4 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 text-xs">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>{submitting ? 'Creating Manifest...' : 'Create Dispatch Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
