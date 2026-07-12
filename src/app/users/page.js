'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Trash2, X, AlertCircle, Shield, CheckCircle2, RefreshCw, Edit3 } from 'lucide-react';

const ROLE_BADGE_STYLES = {
  Admin: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30',
  'Fleet Manager': 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  Driver: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  'Safety Officer': 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
  Finance: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
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
      setError(null);
      const [uRes, rRes] = await Promise.all([fetch('/api/users'), fetch('/api/roles')]);
      const uData = await uRes.json();
      const rData = await rRes.json();
      if (uData.success || Array.isArray(uData.users) || Array.isArray(uData.data)) {
        setUsers(uData.users || uData.data || []);
      } else {
        setError(uData.error || 'Failed to retrieve user list.');
      }
      if (rData.success || Array.isArray(rData.roles) || Array.isArray(rData.data)) {
        setRoles(rData.roles || rData.data || []);
      }
    } catch (err) {
      setError('Network error while communicating with user service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
      } else {
        alert(data.error || 'Status update failed');
      }
    } catch (err) {
      alert('Network connection error');
    }
  };

  const updateUserRole = async (id, newRoleId, newRoleName) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: parseInt(newRoleId, 10) }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role_id: parseInt(newRoleId, 10), role_name: newRoleName } : u));
      } else {
        alert(data.error || 'Role update failed');
      }
    } catch (err) {
      alert('Network connection error');
    }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user account "${name}"? This action is permanent and cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success || res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (err) {
      alert('Network connection error');
    }
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
      if (data.success || res.ok) {
        setModalOpen(false);
        setForm({ name: '', email: '', password: '', role_id: 3, status: 'ACTIVE' });
        load();
      } else {
        setFormError(data.error || 'Failed to create user account');
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role_name === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="saas-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Enterprise User & Access Control</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                RBAC
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage internal staff accounts, assign fleet security roles, and enforce system access policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <UserPlus size={15} />
            <span>Add User</span>
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary p-2"
            title="Refresh accounts"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="saas-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff member name or email address..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Admin', 'Fleet Manager', 'Driver', 'Safety Officer', 'Finance'].map((r) => {
            const isActive = roleFilter === r;
            const count = r === 'ALL' ? users.length : users.filter(u => u.role_name === r).length;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{r}</span>
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table / Grid */}
      {loading ? (
        <div className="saas-card p-12 text-center text-slate-400 dark:text-slate-500">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-sm font-semibold">Loading enterprise personnel directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="saas-card p-16 text-center text-slate-400 dark:text-slate-500 max-w-md mx-auto">
          <Shield size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No users match your criteria</h3>
          <p className="text-xs mt-1 text-slate-500">
            Try adjusting your search query or role filter.
          </p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 md:px-6">Personnel</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filtered.map((u) => {
                  const roleBadgeStyle = ROLE_BADGE_STYLES[u.role_name] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                  const isActive = u.status === 'ACTIVE';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-none">{u.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.role_id || (roles.find(r => r.name === u.role_name)?.id) || 3}
                          onChange={(e) => {
                            const newRoleId = e.target.value;
                            const newRoleName = roles.find(r => r.id === parseInt(newRoleId, 10))?.name || u.role_name;
                            updateUserRole(u.id, newRoleId, newRoleName);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${roleBadgeStyle}`}
                        >
                          {roles.length > 0 ? (
                            roles.map(r => (
                              <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                {r.name}
                              </option>
                            ))
                          ) : (
                            <option value={u.role_id}>{u.role_name}</option>
                          )}
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => updateUserStatus(u.id, u.status)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border transition-all ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                          }`}
                          title="Click to toggle account status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{u.status || 'ACTIVE'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {u.created_at ? u.created_at.split('T')[0] : '—'}
                      </td>

                      <td className="py-3.5 px-4 md:px-6 text-right">
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete user account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" />
                <span>Create New User Account</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={createUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Sarah Jenkins"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="sarah.jenkins@transitops.corp"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Assigned Security Role
                </label>
                <select
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: parseInt(e.target.value, 10) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Admin</option>
                      <option value={2}>Fleet Manager</option>
                      <option value={3}>Driver</option>
                      <option value={4}>Safety Officer</option>
                      <option value={5}>Finance</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary px-5 py-2"
                >
                  <span>{creating ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
