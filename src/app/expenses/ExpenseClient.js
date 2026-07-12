"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Receipt, Search, Truck, Calendar, DollarSign, Filter, Loader2 } from 'lucide-react';

export default function ExpenseClient({ initialLogs = [], vehicles = [], createAction }) {
  const [logs, setLogs] = useState(initialLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.registration_number && l.registration_number.toLowerCase().includes(q)) ||
      (l.vehicle_name && l.vehicle_name.toLowerCase().includes(q)) ||
      (l.remarks && l.remarks.toLowerCase().includes(q)) ||
      (l.date && l.date.includes(q));
    const matchType = !typeFilter || l.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalExpense = logs.reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const tollExpense = logs.filter(l => l.type === 'TOLL').reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const maintExpense = logs.filter(l => l.type === 'MAINTENANCE').reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const miscExpense = logs.filter(l => l.type === 'MISC' || l.type === 'PERMIT').reduce((acc, l) => acc + Number(l.amount || 0), 0);

  const getTypeStyle = (type) => {
    const map = {
      TOLL: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
      MAINTENANCE: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
      PERMIT: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
      MISC: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30',
    };
    return map[type] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* KPI Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenditure</span>
          <p className="text-2xl font-extrabold mt-0.5 text-slate-900 dark:text-white">₹{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">All Operational Costs</p>
        </div>
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tolls & Highway</span>
          <p className="text-2xl font-extrabold mt-0.5 text-amber-600 dark:text-amber-400">₹{tollExpense.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">FASTag / Toll Pass</p>
        </div>
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maintenance & Parts</span>
          <p className="text-2xl font-extrabold mt-0.5 text-blue-600 dark:text-blue-400">₹{maintExpense.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Service Shop Outlay</p>
        </div>
        <div className="glass-card p-4.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Permits & Misc</span>
          <p className="text-2xl font-extrabold mt-0.5 text-purple-600 dark:text-purple-400">₹{miscExpense.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Compliance & Sundries</p>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search expense records by vehicle REG, remarks, or log date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Expense Categories</option>
            <option value="TOLL">Highway Tolls (TOLL)</option>
            <option value="MAINTENANCE">Maintenance / Repairs</option>
            <option value="PERMIT">Regional Permits</option>
            <option value="MISC">Miscellaneous (MISC)</option>
          </select>

          <button
            onClick={() => { setIsModalOpen(true); setError(''); }}
            className="btn-primary text-xs py-2 px-4 justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/20"
          >
            <Plus size={16} />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 md:px-6">Log Date</th>
                <th className="py-3.5 px-4">Carrier Vehicle</th>
                <th className="py-3.5 px-4">Category Type</th>
                <th className="py-3.5 px-4">Expense Amount</th>
                <th className="py-3.5 px-4 md:px-6">Remarks / Justification</th>
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
                      <span className="text-xs text-slate-400 font-mono">{log.registration_number || 'General Fleet'}</span>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {log.vehicle_name || 'Assigned Carrier'}
                    </p>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase inline-block ${getTypeStyle(log.type)}`}>
                      {log.type}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-extrabold text-xs text-slate-900 dark:text-white">
                    ₹{Number(log.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-4 px-4 md:px-6 text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                    {log.remarks || <span className="text-slate-400 italic">No notes attached</span>}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                    <Receipt size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No expense logs recorded</h3>
                    <p className="text-xs mt-1 text-slate-500">
                      {search || typeFilter ? 'Try clearing filters to view all records.' : 'Click "Record Expense" above to log operational vouchers.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Fleet Voucher / Expense</h3>
                  <p className="text-xs text-slate-500">Log toll receipts, permits & transit fees</p>
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
                  <label className={labelClass}>Voucher Date *</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Select Vehicle *</label>
                  <select name="vehicleId" required className={inputClass}>
                    <option value="">Select Unit...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} ({v.vehicle_name || 'Carrier'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category Type *</label>
                  <select name="type" required className={inputClass}>
                    <option value="TOLL">Toll / Highway Charge</option>
                    <option value="MAINTENANCE">Maintenance / Parts</option>
                    <option value="PERMIT">Permit / Border Tax</option>
                    <option value="MISC">Miscellaneous Cost</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Amount (₹) *</label>
                  <input type="number" step="0.01" name="amount" required className={inputClass} placeholder="e.g., 1250" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Remarks / Justification Notes</label>
                <textarea name="remarks" rows="2" className={inputClass} placeholder="e.g., FASTag recharge or inter-state permit toll fee..." />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-4 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>{submitting ? 'Saving...' : 'Save Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
