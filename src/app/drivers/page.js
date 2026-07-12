'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';

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
    total:     drivers.length,
    available: drivers.filter((d) => d.status === 'AVAILABLE').length,
    on_trip:   drivers.filter((d) => d.status === 'ON_TRIP').length,
    suspended: drivers.filter((d) => d.status === 'SUSPENDED').length,
  };

  // License expiry warning
  const expiryWarnings = drivers.filter((d) => {
    const days = Math.ceil((new Date(d.license_expiry) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30;
  });

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

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete driver "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) fetchDrivers();
    else alert(json.error);
  };

  const daysUntilExpiry = (dateStr) => {
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  return (
    <AppShell title="Driver Management">
      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Drivers', value: stats.total,     icon: '🧑‍✈️', color: 'var(--accent)' },
          { label: 'Available',     value: stats.available, icon: '✅', color: 'var(--green)' },
          { label: 'On Trip',       value: stats.on_trip,   icon: '🛣️', color: 'var(--accent-light)' },
          { label: 'Suspended',     value: stats.suspended, icon: '🚫', color: 'var(--red)' },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)` }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* License expiry alerts */}
      {expiryWarnings.length > 0 && (
        <div className={`alert ${expiryWarnings.some(d => daysUntilExpiry(d.license_expiry) <= 7) ? 'alert-critical' : 'alert-warning'}`}>
          ⚠️ <strong>{expiryWarnings.length} driver{expiryWarnings.length > 1 ? 's have' : ' has'} license expiring within 30 days:</strong>{' '}
          {expiryWarnings.map(d => `${d.name} (${daysUntilExpiry(d.license_expiry)}d)`).join(', ')}
        </div>
      )}

      {/* Table card */}
      <div className="card">
        <div className="toolbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search by name, code, license…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {['AVAILABLE','ON_TRIP','OFF_DUTY','SUSPENDED'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <div className="toolbar-end">
            <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>
              + Add Driver
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-row"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧑‍✈️</div>
            <div className="empty-text">{search || statusFilter ? 'No drivers match your filter' : 'No drivers yet — add one!'}</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Employee Code</th>
                  <th>License</th>
                  <th>Type</th>
                  <th>Expiry</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const days = daysUntilExpiry(d.license_expiry);
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="td-primary">{d.name}</div>
                        <div className="text-muted">{d.email}</div>
                      </td>
                      <td className="font-mono">{d.employee_code}</td>
                      <td className="font-mono">{d.license_number}</td>
                      <td><span className="badge badge-info">{d.license_type}</span></td>
                      <td>
                        <span style={{ color: days <= 7 ? 'var(--red)' : days <= 30 ? 'var(--yellow)' : 'inherit' }}>
                          {d.license_expiry}
                          {days <= 30 && <span style={{ marginLeft: 4, fontSize: '0.7rem' }}>({days}d)</span>}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 36, height: 4, borderRadius: 2,
                              background: 'var(--border)',
                              position: 'relative', overflow: 'hidden'
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: 0, left: 0,
                              height: '100%',
                              width: `${d.safety_score}%`,
                              background: d.safety_score >= 90 ? 'var(--green)' : d.safety_score >= 70 ? 'var(--yellow)' : 'var(--red)',
                              borderRadius: 2,
                            }} />
                          </div>
                          <span className="text-muted">{d.safety_score}</span>
                        </div>
                      </td>
                      <td><StatusBadge value={d.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/drivers/${d.id}`} className="btn btn-ghost btn-sm">View</Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(d.id, d.name)}
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Driver</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" required
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@transitops.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Code *</label>
                  <input className="form-input" required
                    value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    placeholder="EMP-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number *</label>
                  <input className="form-input" required
                    value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                    placeholder="DL-MH-2020-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">License Type *</label>
                  <select className="form-select" value={form.license_type}
                    onChange={(e) => setForm({ ...form, license_type: e.target.value })}>
                    {LICENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry *</label>
                  <input className="form-input" type="date" required
                    value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input className="form-input" type="date"
                    value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
                </div>
              </div>
              {error && <div className="form-error mt-2">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
