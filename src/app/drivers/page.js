'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, AlertTriangle, X, Users, Shield, Award, Phone, Calendar, RefreshCw, Eye, ArrowRight } from 'lucide-react';

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
    setLoading(true);
    try {
      const res = await fetch('/api/drivers');
      const json = await res.json();
      if (json.success || Array.isArray(json.data) || Array.isArray(json)) {
        setDrivers(json.data || json.drivers || (Array.isArray(json) ? json : []));
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.employee_code && d.employee_code.toLowerCase().includes(q)) ||
      (d.license_number && d.license_number.toLowerCase().includes(q));
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
    if (!dateStr) return 999;
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
      if (json.success || res.ok) {
        setShowModal(false);
        setForm(INITIAL_FORM);
        fetchDrivers();
      } else {
        setError(json.error || 'Failed to register driver.');
      }
    } catch (err) {
      setError('Network connection error while submitting driver.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
      ON_TRIP: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
      SUSPENDED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30',
      OFF_DUTY: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    };
    const labels = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', SUSPENDED: 'Suspended', OFF_DUTY: 'Off Duty' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${styles[status] || styles.OFF_DUTY}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'AVAILABLE' ? 'bg-emerald-500' : status === 'ON_TRIP' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
        <span>{labels[status] || status}</span>
      </span>
    );
  };

  const getSafetyScoreBadge = (score) => {
    const val = Number(score || 100);
    let color = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
    if (val < 80) color = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';
    if (val < 65) color = 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30';
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1 ${color}`}>
        <Award size={13} />
        <span>{val} / 100</span>
      </span>
    );
  };

  const statCards = [
    { label: 'Total Fleet Drivers', value: stats.total, color: 'text-slate-900 dark:text-white', badge: 'Active Directory' },
    { label: 'Available Right Now', value: stats.available, color: 'text-emerald-600 dark:text-emerald-400', badge: 'Dispatch Ready' },
    { label: 'Currently On Trip', value: stats.on_trip, color: 'text-blue-600 dark:text-blue-400', badge: 'In Transit' },
    { label: 'Suspended / Inactive', value: stats.suspended, color: 'text-red-600 dark:text-red-400', badge: 'Action Required' },
  ];

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="saas-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-emerald-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Driver Roster & Safety Index</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                {drivers.length} Drivers
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage fleet operators, verify commercial license validity, track telemetry safety scores, and dispatch personnel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => { setShowModal(true); setError(''); }}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Plus size={16} />
            <span>Register Driver</span>
          </button>
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="btn-secondary p-2"
            title="Refresh roster"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* License Expiry Warnings Pill Banner */}
      {expiryWarnings.length > 0 && (
        <div className="p-4 rounded-2xl flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={18} />
          <div className="flex-1">
            <p className="font-bold text-sm">
              {expiryWarnings.length} Commercial Driver License{expiryWarnings.length > 1 ? 's are' : ' is'} expiring within 30 days!
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {expiryWarnings.map(d => {
                const days = daysUntilExpiry(d.license_expiry);
                return (
                  <Link
                    key={d.id}
                    href={`/drivers/${d.id}`}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 font-bold text-xs hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>{d.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${days < 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {days < 0 ? 'EXPIRED' : `${days}d left`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="saas-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search drivers by name, email, employee code, or driving license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['', 'AVAILABLE', 'ON_TRIP', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Drivers' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers Table / Roster */}
      {loading ? (
        <div className="saas-card p-12 text-center text-slate-400 dark:text-slate-500">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-emerald-500" />
          <p className="text-sm font-semibold">Loading driver roster & safety index...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="saas-card p-16 text-center text-slate-400 dark:text-slate-500 max-w-md mx-auto">
          <Users size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No registered drivers found</h3>
          <p className="text-xs mt-1 text-slate-500">
            {search || statusFilter
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Register Driver" above to onboard your first operator.'}
          </p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 md:px-6">Driver Personnel</th>
                  <th className="py-3 px-4">License Credentials</th>
                  <th className="py-3 px-4">Safety Score</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filtered.map((d) => {
                  const days = daysUntilExpiry(d.license_expiry);
                  const isExpired = days < 0;
                  const isExpiringSoon = days >= 0 && days <= 30;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                            {d.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/drivers/${d.id}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block">
                              {d.name}
                            </Link>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {d.employee_code || `EMP-${d.id}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            {d.license_number || 'N/A'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                            {d.license_type || 'HMV'}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold mt-1 flex items-center gap-1 ${
                          isExpired ? 'text-red-600 dark:text-red-400 font-bold' :
                          isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-bold' :
                          'text-slate-500 dark:text-slate-400'
                        }`}>
                          <Calendar size={12} />
                          <span>Exp: {d.license_expiry || 'N/A'}</span>
                          {isExpired && <span className="text-xs px-1 bg-red-100 dark:bg-red-500/20 text-red-600 rounded">EXPIRED</span>}
                          {isExpiringSoon && <span className="text-xs px-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded">{days}d left</span>}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {getSafetyScoreBadge(d.safety_score)}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                          <Phone size={13} className="text-slate-400" />
                          <span>{d.phone || 'No phone provided'}</span>
                        </p>
                        {d.email && (
                          <p className="text-sm text-slate-400 dark:text-slate-500 truncate max-w-[160px] mt-0.5">
                            {d.email}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(d.status)}
                      </td>

                      <td className="py-3.5 px-4 md:px-6 text-right">
                        <Link
                          href={`/drivers/${d.id}`}
                          className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 hover:border-blue-500/60"
                        >
                          <Eye size={14} className="text-blue-500" />
                          <span>Profile & Licenses</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Register New Commercial Driver</h3>
                  <p className="text-xs text-slate-500">Enter operator profile and driving permit credentials</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Rahul Sharma" />
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul.s@transitops.corp" />
                </div>
                <div>
                  <label className={labelClass}>Employee Code *</label>
                  <input required className={inputClass} value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="EMP-0142" />
                </div>
                <div>
                  <label className={labelClass}>Contact Number</label>
                  <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className={labelClass}>License Number *</label>
                  <input required className={inputClass} value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} placeholder="DL-MH-2021-99214" />
                </div>
                <div>
                  <label className={labelClass}>License Category *</label>
                  <select className={inputClass} value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })}>
                    {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>License Expiration Date *</label>
                  <input type="date" required className={inputClass} value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Joining Date</label>
                  <input type="date" className={inputClass} value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 text-xs">
                  <span>{submitting ? 'Registering...' : 'Register Driver'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
