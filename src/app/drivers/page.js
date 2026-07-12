'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';

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
    switch (status) {
      case 'AVAILABLE': return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Available</span>;
      case 'ON_TRIP': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">On Trip</span>;
      case 'SUSPENDED': return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Suspended</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Driver Management</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Drivers</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">On Trip</p>
            <p className="text-2xl font-bold text-blue-600">{stats.on_trip}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Suspended</p>
            <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
          </div>
        </div>
      </div>

      {/* Expiry Warnings */}
      {expiryWarnings.length > 0 && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${expiryWarnings.some(d => daysUntilExpiry(d.license_expiry) <= 7) ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">{expiryWarnings.length} driver{expiryWarnings.length > 1 ? 's have' : ' has'} license expiring within 30 days</p>
            <p className="text-sm mt-1">{expiryWarnings.map(d => `${d.name} (${daysUntilExpiry(d.license_expiry)}d)`).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search drivers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => { setShowModal(true); setError(''); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Driver
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3">License No.</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Expiry</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No drivers found.</td></tr>
              ) : (
                filtered.map((d) => {
                  const days = daysUntilExpiry(d.license_expiry);
                  const isExpired = days < 0;
                  
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{d.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{d.license_number}</td>
                      <td className="px-6 py-4">{d.license_type || 'LMV'}</td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-xs ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                          {d.license_expiry} {isExpired && '(EXPIRED)'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{d.phone || '-'}</td>
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
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-800">Add New Driver</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code *</label>
                  <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="EMP-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Number *</label>
                  <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} placeholder="DL-MH-2020-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Type *</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })}>
                    {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Expiry *</label>
                  <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
                </div>
              </div>
              
              {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">⚠ {error}</div>}
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
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
