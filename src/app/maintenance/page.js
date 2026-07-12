'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';

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
    try {
      const [mRes, vRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/vehicles').catch(() => ({ json: async () => ({ success: false }) })),
      ]);
      const mJson = await mRes.json();
      if (mJson.success) setRecords(mJson.data);

      // Try to load vehicles for the dropdown - fallback to listing from maintenance data
      try {
        const vJson = await vRes.json();
        if (vJson.success) setVehicles(vJson.data);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch vehicles separately
  useEffect(() => {
    fetchData();
    // Fetch vehicles from DB
    fetch('/api/vehicles')
      .then(r => r.json())
      .then(j => { if (j.success) setVehicles(j.data); })
      .catch(() => {});
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

  // Maintenance due within 3 days
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
        setShowModal(false);
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

  const priorityClass = (p) => {
    const map = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical-p' };
    return map[p] || '';
  };

  return (
    <AppShell title="Maintenance Management">
      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Records',   value: stats.total,    icon: '📋', color: 'var(--accent)' },
          { label: 'Active',          value: stats.active,   icon: '🔧', color: 'var(--yellow)' },
          { label: 'Closed',          value: stats.closed,   icon: '✅', color: 'var(--green)' },
          { label: 'Critical Active', value: stats.critical, icon: '🚨', color: 'var(--red)' },
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

      {/* Due soon alerts */}
      {dueSoon.length > 0 && (
        <div className="alert alert-warning">
          🔧 <strong>{dueSoon.length} maintenance record{dueSoon.length > 1 ? 's' : ''} due within 3 days:</strong>{' '}
          {dueSoon.map(r => `${r.registration_number} – ${r.maintenance_type}`).join(', ')}
        </div>
      )}

      {/* Table Card */}
      <div className="card">
        <div className="toolbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search by vehicle, type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 'auto' }}
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }}
            value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="toolbar-end">
            <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>
              + Schedule Maintenance
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-row"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔧</div>
            <div className="empty-text">{search || statusFilter || priorityFilter ? 'No records match your filter' : 'No maintenance records yet'}</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Completed</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="td-primary">{r.registration_number}</div>
                      <div className="text-muted">{r.vehicle_name}</div>
                    </td>
                    <td className="td-primary">{r.maintenance_type}</td>
                    <td><span className={`badge ${priorityClass(r.priority)}`}>{r.priority}</span></td>
                    <td><StatusBadge value={r.status} /></td>
                    <td className="text-muted">{r.scheduled_date || '—'}</td>
                    <td className="text-muted">{r.completed_date || '—'}</td>
                    <td style={{ color: 'var(--text-primary)' }}>₹{Number(r.cost).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/maintenance/${r.id}`} className="btn btn-ghost btn-sm">View</Link>
                        {r.status === 'ACTIVE' && (
                          <button className="btn btn-success btn-sm" onClick={() => closeRecord(r.id)}>Close</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(r.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Maintenance Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Schedule Maintenance</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="alert alert-info" style={{ margin: '0 0 16px' }}>
              ℹ️ Creating this record will automatically set the vehicle status to <strong>IN_SHOP</strong>.
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Vehicle *</label>
                  <select className="form-select" required
                    value={form.vehicle_id}
                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} — {v.name} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Maintenance Type *</label>
                  <input className="form-input" required
                    placeholder="e.g. Oil Change, Engine Repair, Tyre Replace"
                    value={form.maintenance_type}
                    onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority *</label>
                  <select className="form-select" value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Cost (₹)</label>
                  <input className="form-input" type="number" min="0"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input className="form-input" type="date"
                    value={form.scheduled_date}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Created By (User ID)</label>
                  <input className="form-input" type="number" min="1"
                    value={form.created_by}
                    onChange={(e) => setForm({ ...form, created_by: e.target.value })} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea"
                    placeholder="Describe the maintenance work needed…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              {error && <div className="form-error mt-2">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Scheduling…' : 'Schedule Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
