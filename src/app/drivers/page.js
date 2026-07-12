'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle, X, Users } from 'lucide-react';

const INITIAL_FORM = {
  name: '', email: '', employee_code: '',
  license_number: '', license_type: 'HMV',
  license_expiry: '', phone: '', joining_date: '',
};

const LICENSE_TYPES = ['HMV', 'LMV', 'MCWG', 'TRANS'];

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch('/api/drivers');
      const json = await res.json();
      if (json.success) setDrivers(json.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.employee_code?.toLowerCase().includes(q) ||
      d.license_number?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: drivers.length,
    available: drivers.filter((d) => d.status === 'AVAILABLE').length,
    on_trip: drivers.filter((d) => d.status === 'ON_TRIP').length,
    suspended: drivers.filter((d) => d.status === 'SUSPENDED').length,
  };

  const daysUntilExpiry = (dateStr) => {
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const expiryWarnings = drivers.filter((d) => daysUntilExpiry(d.license_expiry) <= 30);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setForm(INITIAL_FORM);
        fetchDrivers();
      } else {
        setError(json.error || 'Failed to create driver');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      ON_TRIP: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      SUSPENDED: 'bg-red-500/15 text-red-400 border-red-500/20',
    };
    const labels = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', SUSPENDED: 'Suspended' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>{labels[status] || status}</span>;
  };

  const statCards = [
    { label: 'Total Drivers', value: stats.total, color: 'text-white' },
    { label: 'Available', value: stats.available, color: 'text-emerald-400' },
    { label: 'On Trip', value: stats.on_trip, color: 'text-blue-400' },
    { label: 'Suspended', value: stats.suspended, color: 'text-red-400' },
  ];

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage drivers, licenses, and compliance</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setError(''); }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-slate-900 p-5 rounded-xl border border-slate-800/60">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {expiryWarnings.length > 0 && (
        <div className="p-4 rounded-xl flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold text-sm">{expiryWarnings.length} driver{expiryWarnings.length > 1 ? 's have' : ' has'} license expiring within 30 days</p>
            <p className="text-xs mt-1 text-amber-500/80">{expiryWarnings.map(d => `${d.name} (${daysUntilExpiry(d.license_expiry)}d)`).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">License No.</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    Loading...
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  <Users size={32} className="mx-auto mb-2 text-slate-600" />
                  No drivers found.
                </td></tr>
              ) : (
                filtered.map((d) => {
                  const days = daysUntilExpiry(d.license_expiry);
                  const isExpired = days < 0;
                  return (
                    <tr key={d.id} className="border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{d.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{d.license_number}</td>
                      <td className="px-6 py-4 text-slate-300">{d.license_type || 'LMV'}</td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-xs ${isExpired ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                          {d.license_expiry} {isExpired && '(EXPIRED)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{d.phone || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-white">Add New Driver</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Full Name *</label><input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Sharma" /></div>
                <div><label className={labelClass}>Email *</label><input type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" /></div>
                <div><label className={labelClass}>Employee Code *</label><input required className={inputClass} value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="EMP-001" /></div>
                <div><label className={labelClass}>Phone</label><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" /></div>
                <div><label className={labelClass}>License Number *</label><input required className={inputClass} value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} placeholder="DL-MH-2020-001" /></div>
                <div><label className={labelClass}>License Type *</label><select className={inputClass} value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })}>{LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className={labelClass}>License Expiry *</label><input type="date" required className={inputClass} value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} /></div>
                <div><label className={labelClass}>Joining Date</label><input type="date" className={inputClass} value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} /></div>
              </div>
              
              {error && <div className="mt-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">⚠ {error}</div>}
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg disabled:opacity-50 shadow-lg shadow-blue-500/20">
                  {submitting ? 'Creating...' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
