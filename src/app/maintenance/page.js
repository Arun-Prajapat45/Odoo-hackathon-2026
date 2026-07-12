'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, AlertTriangle, CheckCircle, XCircle, Wrench, Truck, Calendar, ShieldAlert, RefreshCw } from 'lucide-react';

const INITIAL_FORM = {
  vehicle_id: '', maintenance_type: '', description: '',
  priority: 'MEDIUM', cost: '', scheduled_date: '', created_by: 1,
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, vRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/vehicles').catch(() => ({ json: async () => ({ success: false }) })),
      ]);
      const mJson = await mRes.json();
      if (mJson.success || Array.isArray(mJson.data)) setRecords(mJson.data || []);

      try {
        const vJson = await vRes.json();
        if (vJson.success || Array.isArray(vJson.data)) setVehicles(vJson.data || []);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (r.maintenance_type && r.maintenance_type.toLowerCase().includes(q)) ||
      (r.registration_number && r.registration_number.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q));
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchPriority = !priorityFilter || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    total: records.length,
    active: records.filter((r) => r.status === 'ACTIVE').length,
    closed: records.filter((r) => r.status === 'CLOSED').length,
    critical: records.filter((r) => r.priority === 'CRITICAL' && r.status === 'ACTIVE').length,
  };

  const dueSoon = records.filter((r) => {
    if (!r.scheduled_date || r.status !== 'ACTIVE') return false;
    const days = Math.ceil((new Date(r.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 3;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cost: Number(form.cost) || 0 }),
      });
      const json = await res.json();
      if (json.success || res.ok) {
        setForm(INITIAL_FORM);
        setShowModal(false);
        fetchData();
      } else {
        setError(json.error || 'Failed to create service log.');
      }
    } catch {
      setError('Network connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeRecord = async (id) => {
    if (!confirm('Mark this maintenance ticket as COMPLETED/CLOSED? The assigned vehicle will return to AVAILABLE.')) return;
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED', completed_date: new Date().toISOString().split('T')[0] }),
      });
      const json = await res.json();
      if (json.success || res.ok) fetchData();
      else alert(json.error || 'Update failed');
    } catch {
      alert('Network error');
    }
  };

  const deleteRecord = async (id) => {
    if (!confirm('Permanently delete this maintenance log record?')) return;
    try {
      const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success || res.ok) fetchData();
      else alert(json.error || 'Delete failed');
    } catch {
      alert('Network error');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>In Shop (Active)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 inline-flex items-center gap-1.5">
        <CheckCircle size={13} className="text-emerald-500" />
        <span>Completed</span>
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      CRITICAL: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30 font-extrabold animate-pulse',
      HIGH: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/30 font-bold',
      MEDIUM: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30 font-semibold',
      LOW: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 font-medium',
    };
    return <span className={`px-2.5 py-1 rounded-lg text-sm uppercase tracking-wider border inline-flex items-center gap-1 ${styles[priority] || styles.LOW}`}>
      {priority === 'CRITICAL' && <ShieldAlert size={12} />}
      <span>{priority}</span>
    </span>;
  };

  const statCards = [
    { label: 'Total Service Tickets', value: stats.total, color: 'text-slate-900 dark:text-white', badge: 'All Records' },
    { label: 'Active In Shop', value: stats.active, color: 'text-amber-600 dark:text-amber-400', badge: 'Under Repair' },
    { label: 'Completed Repairs', value: stats.closed, color: 'text-emerald-600 dark:text-emerald-400', badge: 'Resolved' },
    { label: 'Critical Priority Tickets', value: stats.critical, color: 'text-red-600 dark:text-red-400', badge: 'Immediate Action' },
  ];

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="saas-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/10 via-orange-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <Wrench size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Fleet Maintenance & Service Logs</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                {records.length} Logs
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Track preventive service schedules, log repair costs, monitor critical shop work orders, and maintain vehicle health.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => { setShowModal(true); setError(''); }}
            className="btn-primary text-xs py-2 px-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20"
          >
            <Plus size={16} />
            <span>Log Service Ticket</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-secondary p-2"
            title="Refresh logs"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="saas-card p-4.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {s.badge}
            </span>
            <p className={`text-2xl font-extrabold mt-0.5 ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Due Soon Warning Alert Banner */}
      {dueSoon.length > 0 && (
        <div className="p-4 rounded-2xl flex items-center justify-between gap-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-red-500 animate-bounce" />
            <span>
              <strong>Attention Required:</strong> {dueSoon.length} maintenance work order{dueSoon.length > 1 ? 's are' : ' is'} scheduled due within the next 72 hours!
            </span>
          </div>
          <button
            onClick={() => setPriorityFilter('CRITICAL')}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
          >
            Filter Critical Due
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="saas-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search tickets by service type, vehicle REG, or problem description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active (In Shop)</option>
            <option value="CLOSED">Completed (Closed)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p} Priority</option>)}
          </select>
        </div>
      </div>

      {/* Maintenance Table */}
      {loading ? (
        <div className="saas-card p-12 text-center text-slate-400 dark:text-slate-500">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-amber-500" />
          <p className="text-sm font-semibold">Loading shop maintenance logs and service orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="saas-card p-16 text-center text-slate-400 dark:text-slate-500 max-w-md mx-auto">
          <Wrench size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No maintenance tickets found</h3>
          <p className="text-xs mt-1 text-slate-500">
            {search || statusFilter || priorityFilter
              ? 'Try clearing your search filters to view all records.'
              : 'Click "Log Service Ticket" above to record shop repairs or scheduled maintenance.'}
          </p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 md:px-6">Carrier Vehicle</th>
                  <th className="py-3.5 px-4">Service Details & Task</th>
                  <th className="py-3.5 px-4">Priority Level</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Estimated Cost</th>
                  <th className="py-3.5 px-4">Shop Status</th>
                  <th className="py-3.5 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 md:px-6">
                      {r.vehicle_id ? (
                        <Link href={`/vehicles/${r.vehicle_id}`} className="font-mono text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                          <Truck size={14} className="text-slate-400 shrink-0" />
                          <span>{r.registration_number || `UNIT-${r.vehicle_id}`}</span>
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.registration_number || 'General Shop'}</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {r.maintenance_type}
                      </p>
                      {r.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">
                          {r.description}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {getPriorityBadge(r.priority)}
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{r.scheduled_date || 'ASAP'}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-xs text-slate-900 dark:text-white">
                      ₹{Number(r.cost || 0).toLocaleString()}
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(r.status)}
                    </td>

                    <td className="py-4 px-4 md:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'ACTIVE' && (
                          <button
                            onClick={() => closeRecord(r.id)}
                            className="py-1 px-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all inline-flex items-center gap-1"
                            title="Mark Shop Service Completed"
                          >
                            <CheckCircle size={13} />
                            <span>Complete</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteRecord(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete ticket"
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Service Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Log Vehicle Shop Service Order</h3>
                  <p className="text-xs text-slate-500">Record maintenance work order or preventive check</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className={labelClass}>Select Carrier Vehicle *</label>
                <select required className={inputClass} value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
                  <option value="">-- Select Vehicle Unit --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} ({v.vehicle_name || 'Carrier'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Service Type *</label>
                  <input required className={inputClass} placeholder="e.g., Engine Oil Change & Filters" value={form.maintenance_type} onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Priority Level *</label>
                  <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p} Priority</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Estimated Cost (₹) *</label>
                  <input type="number" min="0" required className={inputClass} placeholder="e.g., 4500" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Scheduled / Entry Date *</label>
                  <input type="date" required className={inputClass} value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Problem Description / Notes</label>
                <textarea rows="2" className={inputClass} placeholder="Additional details on required shop repair..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <span>{submitting ? 'Saving Order...' : 'Submit Work Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
