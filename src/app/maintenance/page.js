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
      {/* Main Layout: Split Form and Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        
        {/* Left Side: Form */}
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, fontFamily: 'Space Grotesk', textTransform: 'uppercase', marginBottom: '16px' }}>
            LOG SERVICE RECORD
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>VEHICLE</label>
              <select className="form-select" required
                value={form.vehicle_id}
                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                style={{ borderRadius: '8px' }}>
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>SERVICE TYPE</label>
              <input className="form-input" required
                placeholder="Oil Change"
                value={form.maintenance_type}
                onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                style={{ borderRadius: '8px' }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>COST</label>
              <input className="form-input" type="number" min="0" required
                placeholder="2500"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                style={{ borderRadius: '8px' }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>DATE</label>
              <input className="form-input" type="date" required
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                style={{ borderRadius: '8px' }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>STATU</label>
              <select className="form-select" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={{ borderRadius: '8px' }}>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {error && <div className="form-error mt-2">⚠ {error}</div>}

            <button type="submit" className="btn btn-primary" disabled={submitting} 
              style={{ width: '100%', padding: '12px', background: '#FFB800', color: '#000', borderRadius: '8px', fontSize: '1rem', marginTop: '8px' }}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </form>

        </div>

        {/* Right Side: Table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, fontFamily: 'Space Grotesk', textTransform: 'uppercase' }}>
              SERVICE LOG
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="search-bar" style={{ width: '200px' }}>
                <span className="search-icon">🔍</span>
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ background: 'transparent', borderRadius: '4px', padding: '6px 12px 6px 32px' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'transparent', boxShadow: 'none', padding: 0, border: 'none' }}>
            {loading ? (
              <div className="loading-row"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔧</div>
                <div className="empty-text">No maintenance records yet</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table style={{ background: 'transparent' }}>
                  <thead>
                    <tr>
                      <th>VEHICLE</th>
                      <th>SERVICE</th>
                      <th>COST</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id}>
                        <td>{r.registration_number}</td>
                        <td>{r.maintenance_type}</td>
                        <td>{Number(r.cost).toLocaleString()}</td>
                        <td>
                          {r.status === 'ACTIVE' ? (
                            <StatusBadge value="IN-SHOP" />
                          ) : (
                            <StatusBadge value="COMPLETED" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
