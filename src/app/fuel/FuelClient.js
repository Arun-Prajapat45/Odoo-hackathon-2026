"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Droplet, Search, Truck, Calendar, DollarSign, Gauge, Loader2 } from 'lucide-react';

export default function FuelClient({ initialLogs = [], vehicles = [], createAction }) {
  const [logs, setLogs] = useState(initialLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !q ||
      (l.registration_number && l.registration_number.toLowerCase().includes(q)) ||
      (l.vehicle_name && l.vehicle_name.toLowerCase().includes(q)) ||
      (l.date && l.date.includes(q));
  });

  const totalLiters = logs.reduce((acc, l) => acc + Number(l.liters || 0), 0);
  const totalCost = logs.reduce((acc, l) => acc + Number(l.total_cost || 0), 0);
  const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fuel Volume</span>
          <p className="text-2xl font-extrabold mt-0.5 text-blue-600 dark:text-blue-400">{totalLiters.toFixed(1)} <span className="text-sm font-normal text-slate-500">Liters</span></p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Refueled Across Fleet</p>
        </div>
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fuel Expenditure</span>
          <p className="text-2xl font-extrabold mt-0.5 text-emerald-600 dark:text-emerald-400">₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Cumulative Fuel Spend</p>
        </div>
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Rate / Liter</span>
          <p className="text-2xl font-extrabold mt-0.5 text-indigo-600 dark:text-indigo-400">₹{avgPrice.toFixed(2)}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Weighted Fleet Average</p>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search fuel records by vehicle REG, alias, or log date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => { setIsModalOpen(true); setError(''); }}
          className="btn-primary text-xs py-2 px-4 justify-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/20"
        >
          <Plus size={16} />
          <span>Add Refueling Receipt</span>
        </button>
      </div>

      {/* Fuel Logs Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 md:px-6">Log Date</th>
                <th className="py-3.5 px-4">Carrier Vehicle</th>
                <th className="py-3.5 px-4">Volume Refueled</th>
                <th className="py-3.5 px-4">Rate per Liter</th>
                <th className="py-3.5 px-4">Total Cost</th>
                <th className="py-3.5 px-4 md:px-6">Odometer Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 md:px-6 font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span>{log.date || '—'}</span>
                  </td>

                  <td className="py-4 px-4">
                    {log.vehicle_id ? (
                      <Link href={`/vehicles/${log.vehicle_id}`} className="font-mono text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                        <Truck size={14} className="text-slate-400 shrink-0" />
                        <span>{log.registration_number || `UNIT-${log.vehicle_id}`}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">{log.registration_number || 'N/A'}</span>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {log.vehicle_name || 'Fleet Unit'}
                    </p>
                  </td>

                  <td className="py-4 px-4 font-bold text-xs text-blue-600 dark:text-blue-400">
                    {Number(log.liters || 0).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">Liters</span>
                  </td>

                  <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    ₹{Number(log.price_per_liter || 0).toFixed(2)}
                  </td>

                  <td className="py-4 px-4 font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                    ₹{Number(log.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-4 px-4 md:px-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {log.odometer ? (
                      <span className="flex items-center gap-1">
                        <Gauge size={13} className="text-slate-400" />
                        <span>{Number(log.odometer).toLocaleString()} km</span>
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                    <Droplet size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No fuel receipts logged</h3>
                    <p className="text-xs mt-1 text-slate-500">
                      {search ? 'Try adjusting your search criteria.' : 'Click "Add Refueling Receipt" above to log your first fuel transaction.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fuel Receipt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Droplet size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Log Refueling Receipt</h3>
                  <p className="text-xs text-slate-500">Record fuel station transaction & mileage</p>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Refuel Date *</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Select Vehicle *</label>
                  <select name="vehicleId" required className={inputClass}>
                    <option value="">Choose Unit...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} ({v.vehicle_name || 'Carrier'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Volume (Liters) *</label>
                  <input type="number" step="0.01" name="liters" required className={inputClass} placeholder="e.g., 45.50" />
                </div>
                <div>
                  <label className={labelClass}>Rate per Liter (₹) *</label>
                  <input type="number" step="0.01" name="pricePerLiter" required className={inputClass} placeholder="e.g., 94.80" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Current Odometer Reading (km)</label>
                <input type="number" step="0.1" name="odometer" className={inputClass} placeholder="Mileage on dashboard (optional)" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-4 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>{submitting ? 'Logging...' : 'Save Fuel Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
