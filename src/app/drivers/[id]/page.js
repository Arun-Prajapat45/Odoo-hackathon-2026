'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';
import ManifestRail from '@/components/ManifestRail';

const DRIVER_STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];

export default function DriverDetailPage() {
  const { id } = useParams();
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
      if (json.success) {
        setDriver(json.data);
        setEditForm({
          license_number: json.data.license_number,
          license_type:   json.data.license_type,
          license_expiry: json.data.license_expiry,
          phone:          json.data.phone || '',
          safety_score:   json.data.safety_score,
        });
      } else {
        router.push('/drivers');
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchDriver(); }, [fetchDriver]);

  const updateStatus = async (status) => {
    setStatusLoading(true);
    const res = await fetch(`/api/drivers/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) fetchDriver();
    else alert(json.error);
    setStatusLoading(false);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditErr('');
    const res = await fetch(`/api/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    if (json.success) { setShowEdit(false); fetchDriver(); }
    else setEditErr(json.error);
    setEditLoading(false);
  };

  const submitLicense = async (e) => {
    e.preventDefault();
    setLicenseLoading(true);
    setLicenseErr('');
    const res = await fetch(`/api/drivers/${id}/license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(licenseForm),
    });
    const json = await res.json();
    if (json.success) {
      setShowLicense(false);
      setLicenseForm({ license_number: '', issue_date: '', expiry_date: '', category: 'HMV', document_url: '' });
      fetchDriver();
    } else setLicenseErr(json.error);
    setLicenseLoading(false);
  };

  const daysLeft = (dateStr) => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  const expiryColor = (days) => days <= 7 ? 'var(--red)' : days <= 30 ? 'var(--yellow)' : 'var(--green)';

  if (loading) return (
    <AppShell title="Driver Details">
      <div className="loading-row"><div className="spinner" /></div>
    </AppShell>
  );

  if (!driver) return null;

  const expDays = daysLeft(driver.license_expiry);

  return (
    <AppShell title="Driver Details">
      {/* Back */}
      <div className="mb-4">
        <Link href="/drivers" className="btn btn-ghost btn-sm">← Back to Drivers</Link>
      </div>

      {/* Header card */}
      <div className="card mb-4">
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="detail-avatar">{driver.name?.[0]?.toUpperCase()}</div>
            <div className="detail-title-group">
              <div className="detail-name">{driver.name}</div>
              <div className="detail-meta">{driver.email} · {driver.employee_code}</div>
              <div className="mt-2">
                <StatusBadge value={driver.status} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>✏️ Edit</button>
          </div>
        </div>

        {/* Info grid */}
        <div className="section-heading">License & Details</div>
        <div className="info-grid">
          {[
            { label: 'License Number', value: driver.license_number },
            { label: 'License Type',   value: driver.license_type   },
            {
              label: 'Expiry Date',
              value: (
                <span style={{ color: expiryColor(expDays) }}>
                  {driver.license_expiry} ({expDays}d)
                </span>
              )
            },
            { label: 'Phone',        value: driver.phone || '—'   },
            { label: 'Joining Date', value: driver.joining_date || '—' },
            { label: 'Safety Score', value: `${driver.safety_score} / 100` },
          ].map((item) => (
            <div className="info-item" key={item.label}>
              <div className="info-label">{item.label}</div>
              <div className="info-value">{item.value}</div>
            </div>
          ))}
        </div>

        {expDays <= 30 && (
          <div className={`alert ${expDays <= 7 ? 'alert-critical' : 'alert-warning'} mt-4`}>
            ⚠️ License expires in {expDays} day{expDays !== 1 ? 's' : ''}.{' '}
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}
              onClick={() => setShowLicense(true)}>Add Renewal →</button>
          </div>
        )}
      </div>

      {/* Status control */}
      <div className="card mb-4">
        <div className="section-heading">Update Status</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DRIVER_STATUSES.map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${driver.status === s ? 'btn-primary' : 'btn-ghost'}`}
              disabled={statusLoading || driver.status === s}
              onClick={() => updateStatus(s)}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* License History */}
      <div className="card mb-4">
        <div className="card-header">
          <div>
            <div className="card-title">License History</div>
            <div className="card-subtitle">{driver.licenses?.length || 0} record(s)</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowLicense(true)}>+ Add License</button>
        </div>
        {!driver.licenses?.length ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-icon">📄</div>
            <div className="empty-text">No license history recorded</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>License No.</th>
                  <th>Category</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Document</th>
                </tr>
              </thead>
              <tbody>
                {driver.licenses.map((l) => (
                  <tr key={l.id}>
                    <td className="td-primary font-mono">{l.license_number}</td>
                    <td><span className="badge badge-info">{l.category}</span></td>
                    <td>{l.issue_date}</td>
                    <td style={{ color: expiryColor(daysLeft(l.expiry_date)) }}>{l.expiry_date}</td>
                    <td>
                      {l.document_url
                        ? <a href={l.document_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View</a>
                        : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trip History */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Trips</div>
            <div className="card-subtitle">Last 10 trips</div>
          </div>
        </div>
        {!driver.trips?.length ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-icon">🛣️</div>
            <div className="empty-text">No trips assigned yet</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Trip #</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {driver.trips.map((t) => (
                  <tr key={t.id}>
                    <td className="td-primary font-mono">{t.trip_number}</td>
                    <td style={{ minWidth: '220px' }}>
                      <ManifestRail source={t.source} destination={t.destination} status={t.status} />
                    </td>
                    <td><StatusBadge value={t.status} /></td>
                    <td className="text-muted">{t.planned_start?.split('T')[0] || t.planned_start?.split(' ')[0]}</td>
                    <td style={{ color: 'var(--green)' }}>₹{Number(t.revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Driver</div>
              <button className="modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <form onSubmit={submitEdit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-input" value={editForm.license_number || ''}
                    onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">License Type</label>
                  <select className="form-select" value={editForm.license_type || 'HMV'}
                    onChange={(e) => setEditForm({ ...editForm, license_type: e.target.value })}>
                    {['HMV','LMV','MCWG','TRANS'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry</label>
                  <input className="form-input" type="date" value={editForm.license_expiry || ''}
                    onChange={(e) => setEditForm({ ...editForm, license_expiry: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Safety Score</label>
                  <input className="form-input" type="number" min="0" max="100" value={editForm.safety_score || 100}
                    onChange={(e) => setEditForm({ ...editForm, safety_score: e.target.value })} />
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

      {/* Add License Modal */}
      {showLicense && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowLicense(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add License Record</div>
              <button className="modal-close" onClick={() => setShowLicense(false)}>✕</button>
            </div>
            <form onSubmit={submitLicense}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">License Number *</label>
                  <input className="form-input" required value={licenseForm.license_number}
                    onChange={(e) => setLicenseForm({ ...licenseForm, license_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={licenseForm.category}
                    onChange={(e) => setLicenseForm({ ...licenseForm, category: e.target.value })}>
                    {['HMV','LMV','MCWG','TRANS'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Issue Date *</label>
                  <input className="form-input" type="date" required value={licenseForm.issue_date}
                    onChange={(e) => setLicenseForm({ ...licenseForm, issue_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input className="form-input" type="date" required value={licenseForm.expiry_date}
                    onChange={(e) => setLicenseForm({ ...licenseForm, expiry_date: e.target.value })} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Document URL</label>
                  <input className="form-input" value={licenseForm.document_url}
                    placeholder="https://storage.example.com/doc.pdf"
                    onChange={(e) => setLicenseForm({ ...licenseForm, document_url: e.target.value })} />
                </div>
              </div>
              {licenseErr && <div className="form-error mt-2">⚠ {licenseErr}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowLicense(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={licenseLoading}>
                  {licenseLoading ? 'Saving…' : 'Add License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
