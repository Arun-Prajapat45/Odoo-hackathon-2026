'use client';

import { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Trash2, X, AlertCircle } from 'lucide-react';

const ROLE_BADGES = {
  Admin: 'badge-red',
  'Fleet Manager': 'badge-blue',
  Driver: 'badge-green',
  'Safety Officer': 'badge-purple',
  Finance: 'badge-amber',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: 3, status: 'ACTIVE' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([fetch('/api/users'), fetch('/api/roles')]);
      const uData = await uRes.json();
      const rData = await rRes.json();
      if (uData.success) setUsers(uData.users);
      else setError(uData.error);
      if (rData.success) setRoles(rData.roles);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateUser = async (id, body) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error || 'Update failed');
    } catch { alert('Network error'); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error || 'Delete failed');
    } catch { alert('Network error'); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setForm({ name: '', email: '', password: '', role_id: 3, status: 'ACTIVE' });
        load();
      } else {
        setFormError(data.error || 'Failed to create user');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role_name === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage accounts, roles, and access control</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <UserPlus size={15} /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-2)' }} />
            <input
              className="form-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
            <option value="ALL">All Roles</option>
            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /> Loading users...</div>
        ) : error ? (
          <div className="empty-state">
            <AlertCircle size={28} />
            <div className="empty-state-title">{error}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={28} />
            <div className="empty-state-title">No users found</div>
            <div className="empty-state-text">Try adjusting your search or filters.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{u.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="user-name">{u.name}</div>
                          <div className="user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${ROLE_BADGES[u.role_name] || 'badge-gray'}`}>{u.role_name}</span>
                        <select
                          className="form-select"
                          value={u.role_id}
                          onChange={e => updateUser(u.id, { role_id: parseInt(e.target.value) })}
                          style={{ width: 'auto', padding: '3px 6px', fontSize: 11, minWidth: 100, background: 'transparent', border: '1px solid var(--border)' }}
                        >
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : u.status === 'SUSPENDED' ? 'badge-red' : 'badge-gray'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => updateUser(u.id, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          className="btn-icon"
                          style={{ width: 28, height: 28, color: 'var(--red)', borderColor: 'transparent' }}
                          onClick={() => deleteUser(u.id, u.name)}
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add User</span>
              <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={createUser}>
              <div className="modal-body">
                {formError && <div className="alert alert-error"><AlertCircle size={14} /> {formError}</div>}
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Strong password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role_id} onChange={e => setForm({ ...form, role_id: parseInt(e.target.value) })}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
