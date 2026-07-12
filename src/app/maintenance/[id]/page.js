'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/maintenance/${id}`);
      const json = await res.json();
      if (json.success) {
        setRecord(json.data);
        setEditForm({
          maintenance_type: json.data.maintenance_type,
          description:      json.data.description || '',
          priority:         json.data.priority,
          cost:             json.data.cost || 0,
          scheduled_date:   json.data.scheduled_date || '',
          completed_date:   json.data.completed_date || '',
        });
      } else {
        router.push('/maintenance');
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditErr('');
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, cost: Number(editForm.cost) }),
    });
    const json = await res.json();
    if (json.success) { setShowEdit(false); fetchRecord(); }
    else setEditErr(json.error);
    setEditLoading(false);
  };

  const closeMaintenance = async () => {
    if (!confirm('Close this maintenance record? The vehicle will become AVAILABLE.')) return;
    setClosing(true);
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CLOSED',
        completed_date: new Date().toISOString().split('T')[0],
      }),
    });
    const json = await res.json();
    if (json.success) fetchRecord();
    else alert(json.error);
    setClosing(false);
  };

  const deleteRecord = async () => {
    if (!confirm('Permanently delete this maintenance record?')) return;
    const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) router.push('/maintenance');
    else alert(json.error);
  };

  const priorityColor = (p) => {
    const map = { LOW: 'var(--green)', MEDIUM: 'var(--yellow)', HIGH: 'var(--orange)', CRITICAL: 'var(--red)' };
    return map[p] || 'var(--text-muted)';
  };

  if (loading) return (
    <AppShell title="Maintenance Details">
      <div className="loading-row"><div className="spinner" /></div>
    </AppShell>
  );
  if (!record) return null;

  return (
    <AppShell title="Maintenance Details">
      <div className="mb-4">
        <Link href="/maintenance" className="btn btn-ghost btn-sm">← Back to Maintenance</Link>
      </div>

      {/* Header card */}
      <div className="card mb-4">
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              className="detail-avatar"
              style={{ background: `color-mix(in srgb, ${priorityColor(record.priority)} 20%, var(--bg-card))` }}
            >
              🔧
            </div>
            <div className="detail-title-group">
              <div className="detail-name">{record.maintenance_type}</div>
              <div className="detail-meta">
                {record.registration_number} · {record.vehicle_name}
              </div>
              <div className="mt-2" style={{ display: 'flex', gap: 8 }}>
                <StatusBadge value={record.status} />
                <span className={`badge`} style={{ color: priorityColor(record.priority), background: `color-mix(in srgb, ${priorityColor(record.priority)} 12%, transparent)` }}>
                  {record.priority}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {record.status === 'ACTIVE' && (
              <>
                <button className="btn btn-success btn-sm" disabled={closing} onClick={closeMaintenance}>
                  {closing ? 'Closing…' : '✅ Close & Release Vehicle'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>✏️ Edit</button>
              </>
            )}
            <button className="btn btn-danger btn-sm" onClick={deleteRecord}>🗑️ Delete</button>
          </div>
        </div>

        {/* Business rule callout */}
        {record.status === 'ACTIVE' && (
          <div className="alert alert-warning">
            🔧 Vehicle <strong>{record.registration_number}</strong> is currently <strong>IN_SHOP</strong>.
            Closing this record will set it back to <strong>AVAILABLE</strong> and notify fleet managers.
          </div>
        )}
        {record.status === 'CLOSED' && (
          <div className="alert alert-info">
            ✅ Maintenance completed. Vehicle <strong>{record.registration_number}</strong> is <strong>AVAILABLE</strong>.
          </div>
        )}

        {/* Detail info */}
        <div className="section-heading mt-4">Maintenance Details</div>
        <div className="info-grid">
          {[
            { label: 'Vehicle',        value: `${record.registration_number} — ${record.vehicle_name}` },
            { label: 'Vehicle Status', value: <StatusBadge value={record.vehicle_status} /> },
            { label: 'Priority',       value: <span style={{ color: priorityColor(record.priority), fontWeight: 600 }}>{record.priority}</span> },
            { label: 'Status',         value: <StatusBadge value={record.status} /> },
            { label: 'Scheduled Date', value: record.scheduled_date || '—' },
            { label: 'Completed Date', value: record.completed_date || '—' },
            { label: 'Cost',           value: `₹${Number(record.cost).toLocaleString()}` },
            { label: 'Created By',     value: record.created_by_name || `User #${record.created_by}` },
          ].map((item) => (
            <div className="info-item" key={item.label}>
              <div className="info-label">{item.label}</div>
              <div className="info-value">{item.value}</div>
            </div>
          ))}
        </div>

        {record.description && (
          <>
            <div className="section-heading mt-4">Description</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {record.description}
            </p>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Maintenance Record</div>
              <button className="modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <form onSubmit={submitEdit}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Maintenance Type</label>
                  <input className="form-input" value={editForm.maintenance_type}
                    onChange={(e) => setEditForm({ ...editForm, maintenance_type: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cost (₹)</label>
                  <input className="form-input" type="number" min="0" value={editForm.cost}
                    onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input className="form-input" type="date" value={editForm.scheduled_date}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Completed Date</label>
                  <input className="form-input" type="date" value={editForm.completed_date}
                    onChange={(e) => setEditForm({ ...editForm, completed_date: e.target.value })} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
              </div>
              {editErr && <div className="form-error mt-2">⚠ {editErr}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
