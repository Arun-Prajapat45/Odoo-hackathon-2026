'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle, XCircle, Wrench } from 'lucide-react';

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

  useEffect(() => { fetchData(); }, [fetchData]);

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
    if (status === 'ACTIVE') return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/15 text-amber-400 border-amber-500/20">In Shop</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Completed</span>;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/20',
      HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
      MEDIUM: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      LOW: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[priority] || styles.LOW}`}>{priority}</span>;
  };

  const statCards = [
    { label: 'Total Logs', value: stats.total, color: 'text-white' },
    { label: 'Active (In Shop)', value: stats.active, color: 'text-amber-400' },
    { label: 'Completed', value: stats.closed, color: 'text-emerald-400' },
    { label: 'Critical Priority', value: stats.critical, color: 'text-red-400' },
  ];

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Maintenance Logs</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-slate-900 p-5 rounded-xl border border-slate-800/60">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {dueSoon.length > 0 && (
        <div className="p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <p className="font-semibold text-sm">{dueSoon.length} maintenance task{dueSoon.length > 1 ? 's are' : ' is'} due within 3 days</p>
        </div>
      )}

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Form */}
        <div className="bg-slate-900 rounded-xl border border-slate-800/60 p-6 h-fit">
          <h2 className="font-semibold text-white mb-4">Log Service Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className={labelClass}>Vehicle *</label><select required className={inputClass} value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}><option value="">-- Select Vehicle --</option>{vehicles.map((v) => (<option key={v.id} value={v.id}>{v.registration_number}</option>))}</select></div>
            <div><label className={labelClass}>Service Type *</label><input required className={inputClass} placeholder="e.g. Oil Change" value={form.maintenance_type} onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })} /></div>
            <div><label className={labelClass}>Cost ($) *</label><input type="number" min="0" required className={inputClass} placeholder="250" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            <div><label className={labelClass}>Date *</label><input type="date" required className={inputClass} value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
            <div><label className={labelClass}>Priority</label><select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            
            {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">⚠ {error}</div>}
            
            <button type="submit" disabled={submitting} className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800/60 flex justify-between items-center flex-wrap gap-4">
            <h2 className="font-semibold text-white">All Records</h2>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />Loading...</div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Wrench size={32} className="mx-auto mb-2 text-slate-600" />No records found.
                  </td></tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{r.registration_number || r.vehicle_id}</td>
                      <td className="px-6 py-4 text-slate-300">{r.maintenance_type}</td>
                      <td className="px-6 py-4">{getPriorityBadge(r.priority)}</td>
                      <td className="px-6 py-4 font-semibold text-white">${Number(r.cost).toLocaleString()}</td>
                      <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {r.status === 'ACTIVE' && (
                            <button onClick={() => closeRecord(r.id)} className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Complete Service">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button onClick={() => deleteRecord(r.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                            <XCircle size={16} />
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
