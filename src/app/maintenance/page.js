'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [mRes, vRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/vehicles').catch(() => ({ json: async () => ({ success: false }) })),
      ]);
      const mJson = await mRes.json();
      if (mJson.success) setRecords(mJson.data);

      try {
        const vJson = await vRes.json();
        if (vJson.success) setVehicles(vJson.data);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.maintenance_type?.toLowerCase().includes(q) ||
      r.registration_number?.toLowerCase().includes(q) ||
      r.vehicle_name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchPriority = !priorityFilter || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    total:    records.length,
    active:   records.filter((r) => r.status === 'ACTIVE').length,
    closed:   records.filter((r) => r.status === 'CLOSED').length,
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
      if (json.success) {
        setForm(INITIAL_FORM);
        fetchData();
      } else {
        setError(json.error || 'Failed to create maintenance record');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const closeRecord = async (id) => {
    if (!confirm('Mark this maintenance as CLOSED? The vehicle will become AVAILABLE.')) return;
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED', completed_date: new Date().toISOString().split('T')[0] }),
    });
    const json = await res.json();
    if (json.success) fetchData();
    else alert(json.error);
  };

  const deleteRecord = async (id) => {
    if (!confirm('Delete this maintenance record?')) return;
    const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) fetchData();
    else alert(json.error);
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">In Shop</span>;
    return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">Completed</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Maintenance Logs</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Logs</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active (In Shop)</p>
            <p className="text-2xl font-bold text-amber-600">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="text-2xl font-bold text-slate-600">{stats.closed}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Critical Priority</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </div>
        </div>
      </div>

      {/* Expiry Warnings */}
      {dueSoon.length > 0 && (
        <div className="p-4 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200 text-red-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">{dueSoon.length} maintenance task{dueSoon.length > 1 ? 's are' : ' is'} due within 3 days</p>
          </div>
        </div>
      )}

      {/* Split Layout: Form & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Log Service Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle *</label>
              <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registration_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service Type *</label>
              <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Oil Change" value={form.maintenance_type} onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($) *</label>
              <input type="number" min="0" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="250" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">⚠ {error}</div>}
            
            <button type="submit" disabled={submitting} className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </form>
        </div>

        {/* Right Side: Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
            <h2 className="font-semibold text-slate-800">All Records</h2>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Cost</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No records found.</td></tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{r.registration_number || r.vehicle_id}</td>
                      <td className="px-6 py-4">{r.maintenance_type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : r.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">${Number(r.cost).toLocaleString()}</td>
                      <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {r.status === 'ACTIVE' && (
                            <button onClick={() => closeRecord(r.id)} className="text-green-600 hover:text-green-800" title="Complete Service">
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button onClick={() => deleteRecord(r.id)} className="text-red-500 hover:text-red-700" title="Delete">
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
