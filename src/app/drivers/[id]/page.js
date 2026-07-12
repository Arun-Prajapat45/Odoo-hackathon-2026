'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';
import ManifestRail from '@/components/ManifestRail';
import {
  ChevronLeft,
  Users,
  Award,
  Phone,
  Mail,
  Calendar,
  Shield,
  FileText,
  Plus,
  Edit2,
  AlertTriangle,
  X,
  ExternalLink,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

const DRIVER_STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];

export default function DriverDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // License modal
  const [showLicense, setShowLicense] = useState(false);
  const [licenseForm, setLicenseForm] = useState({
    license_number: '', issue_date: '', expiry_date: '', category: 'HMV', document_url: ''
  });
  const [licenseErr, setLicenseErr] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);

  const fetchDriver = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drivers/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDriver(json.data);
        setEditForm({
          license_number: json.data.license_number || '',
          license_type:   json.data.license_type || 'HMV',
          license_expiry: json.data.license_expiry || '',
          phone:          json.data.phone || '',
          safety_score:   json.data.safety_score || 100,
        });
      } else {
        router.push('/drivers');
      }
    } catch {
      router.push('/drivers');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchDriver(); }, [fetchDriver]);

  const updateStatus = async (status) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/drivers/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success || res.ok) fetchDriver();
      else alert(json.error || 'Failed to update status');
    } catch {
      alert('Network error');
    } finally {
      setStatusLoading(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditErr('');
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success || res.ok) {
        setShowEdit(false);
        fetchDriver();
      } else {
        setEditErr(json.error || 'Update failed');
      }
    } catch {
      setEditErr('Network error');
    } finally {
      setEditLoading(false);
    }
  };

  const submitLicense = async (e) => {
    e.preventDefault();
    setLicenseLoading(true);
    setLicenseErr('');
    try {
      const res = await fetch(`/api/drivers/${id}/license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseForm),
      });
      const json = await res.json();
      if (json.success || res.ok) {
        setShowLicense(false);
        setLicenseForm({ license_number: '', issue_date: '', expiry_date: '', category: 'HMV', document_url: '' });
        fetchDriver();
      } else {
        setLicenseErr(json.error || 'Failed to add license');
      }
    } catch {
      setLicenseErr('Network error');
    } finally {
      setLicenseLoading(false);
    }
  };

  const daysLeft = (dateStr) => {
    if (!dateStr) return 999;
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getSafetyScoreBadge = (score) => {
    const val = Number(score || 100);
    let color = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
    if (val < 80) color = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';
    if (val < 65) color = 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${color}`}>
        <Award size={15} />
        <span>Safety Score: {val} / 100</span>
      </span>
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div className="glass-card p-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
          <RefreshCw size={32} className="animate-spin mb-3 text-emerald-500" />
          <p className="text-sm font-semibold">Loading driver profile and license history...</p>
        </div>
      </AppShell>
    );
  }

  if (!driver) return null;

  const expDays = daysLeft(driver.license_expiry);
  const isExpired = expDays < 0;
  const isExpiringSoon = expDays >= 0 && expDays <= 30;

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <AppShell>
      {/* Back Button */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <Link href="/drivers" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ChevronLeft size={16} />
          <span>Back to Driver Directory</span>
        </Link>
      </div>

      {/* Driver Header Card */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-blue-900/10 to-slate-900/5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-xl font-extrabold text-white shadow-lg shadow-emerald-500/25 shrink-0">
            {driver.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                {driver.name}
              </h1>
              <StatusBadge value={driver.status} />
              {getSafetyScoreBadge(driver.safety_score)}
            </div>
            <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {driver.employee_code || `EMP-${driver.id}`}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-slate-400" />
                <span>{driver.email}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-slate-400" />
                <span>{driver.phone || 'No contact #'}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Edit2 size={15} className="text-blue-500" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* License Expiry Warning Alert Banner */}
      {expDays <= 30 && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-4 border text-xs font-bold ${
          isExpired
            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0" />
            <span>
              {isExpired ? (
                <>Commercial Driving License <strong>EXPIRED {Math.abs(expDays)} days ago</strong> ({driver.license_expiry}). Immediate renewal mandatory.</>
              ) : (
                <>Commercial Driving License expires in <strong>{expDays} day(s)</strong> on {driver.license_expiry}. Please initiate renewal.</>
              )}
            </span>
          </div>
          <button
            onClick={() => setShowLicense(true)}
            className="btn-secondary py-1.5 px-3 text-xs shrink-0"
          >
            <span>Add Renewal Record →</span>
          </button>
        </div>
      )}

      {/* Status Switcher & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Driver License & Credentials Card */}
          <div className="glass-card p-6">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5 flex items-center justify-between">
              <span>Driver Credentials & Telemetry Details</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{driver.license_type || 'HMV'} Category</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">License Number</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">{driver.license_number || '—'}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">License Type</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{driver.license_type || 'HMV'}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Expiry Date</span>
                <span className={`text-sm font-bold mt-0.5 block flex items-center gap-1 ${isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  <Calendar size={14} />
                  <span>{driver.license_expiry || '—'}</span>
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Phone Number</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{driver.phone || 'No phone'}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Joining Date</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{driver.joining_date || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Safety Rating</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{driver.safety_score || 100} / 100 Points</span>
              </div>
            </div>
          </div>

          {/* Assigned Trip Manifests */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Dispatched Trip History ({driver.trips?.length || 0})
              </h2>
            </div>
            {(!driver.trips || driver.trips.length === 0) ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                No dispatch trips have been assigned to this operator yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      <th className="py-3 px-4">Trip #</th>
                      <th className="py-3 px-4">Route Manifest</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Planned Start</th>
                      <th className="py-3 px-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                    {driver.trips.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">
                          <Link href={`/trips/${t.id}`} className="hover:underline">
                            {t.trip_number || `TRIP-${t.id}`}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <ManifestRail source={t.source} destination={t.destination} status={t.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge value={t.status} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {t.planned_start?.split('T')[0] || t.planned_start?.split(' ')[0] || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{Number(t.revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Status Override & License History) */}
        <div className="space-y-6">
          {/* Status Override Card */}
          <div className="glass-card p-6">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <Shield size={16} className="text-emerald-500" />
              <span>Duty Status Manual Override</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {DRIVER_STATUSES.map((s) => {
                const isActive = driver.status === s;
                return (
                  <button
                    key={s}
                    disabled={statusLoading || isActive}
                    onClick={() => updateStatus(s)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? s === 'AVAILABLE' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' :
                          s === 'ON_TRIP' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' :
                          s === 'SUSPENDED' ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20' :
                          'bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* License Records Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                License Renewal History ({driver.licenses?.length || 0})
              </h2>
              <button
                onClick={() => setShowLicense(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Record</span>
              </button>
            </div>

            {(!driver.licenses || driver.licenses.length === 0) ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 text-xs">
                No archived license renewal records.
              </div>
            ) : (
              <div className="space-y-3">
                {driver.licenses.map((l) => {
                  const lDays = daysLeft(l.expiry_date);
                  return (
                    <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {l.license_number}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">
                          {l.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Issued: {l.issue_date}</span>
                        <span className={`font-bold ${lDays < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          Exp: {l.expiry_date}
                        </span>
                      </div>
                      {l.document_url && (
                        <div className="pt-1">
                          <a href={l.document_url} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                            <ExternalLink size={12} /> View Document Scan
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Driver Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 size={18} className="text-blue-500" />
                <span>Edit Driver Profile & Safety Score</span>
              </h3>
              <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className={labelClass}>License Number</label>
                <input className={inputClass} value={editForm.license_number || ''} onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>License Category</label>
                  <select className={inputClass} value={editForm.license_type || 'HMV'} onChange={(e) => setEditForm({ ...editForm, license_type: e.target.value })}>
                    {['HMV','LMV','MCWG','TRANS'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>License Expiry</label>
                  <input type="date" className={inputClass} value={editForm.license_expiry || ''} onChange={(e) => setEditForm({ ...editForm, license_expiry: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Contact Phone</label>
                <input className={inputClass} value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Telemetry Safety Score (0 - 100)</label>
                <input type="number" min="0" max="100" className={inputClass} value={editForm.safety_score || 100} onChange={(e) => setEditForm({ ...editForm, safety_score: parseInt(e.target.value, 10) || 0 })} />
              </div>

              {editErr && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-500/30">
                  {editErr}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                <button type="submit" disabled={editLoading} className="btn-primary px-5 py-2 text-xs">
                  {editLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add License Renewal Record Modal */}
      {showLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                <span>Archive License Renewal Record</span>
              </h3>
              <button onClick={() => setShowLicense(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitLicense} className="space-y-4">
              <div>
                <label className={labelClass}>License Number *</label>
                <input required className={inputClass} value={licenseForm.license_number} onChange={(e) => setLicenseForm({ ...licenseForm, license_number: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category *</label>
                  <select className={inputClass} value={licenseForm.category} onChange={(e) => setLicenseForm({ ...licenseForm, category: e.target.value })}>
                    {['HMV','LMV','MCWG','TRANS'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Issue Date *</label>
                  <input type="date" required className={inputClass} value={licenseForm.issue_date} onChange={(e) => setLicenseForm({ ...licenseForm, issue_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>New Expiration Date *</label>
                <input type="date" required className={inputClass} value={licenseForm.expiry_date} onChange={(e) => setLicenseForm({ ...licenseForm, expiry_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Document URL (Optional Scan)</label>
                <input className={inputClass} value={licenseForm.document_url} placeholder="https://storage.example.com/license-scan.pdf" onChange={(e) => setLicenseForm({ ...licenseForm, document_url: e.target.value })} />
              </div>

              {licenseErr && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-500/30">
                  {licenseErr}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowLicense(false)} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                <button type="submit" disabled={licenseLoading} className="btn-primary px-5 py-2 text-xs">
                  {licenseLoading ? 'Archiving...' : 'Archive License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
