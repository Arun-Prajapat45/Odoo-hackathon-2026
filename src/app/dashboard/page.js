'use client';

import { useState, useEffect } from 'react';
import { Users, Bell, Truck, AlertTriangle, TrendingUp, Wrench } from 'lucide-react';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, notifsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/notifications'),
        ]);

        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
        const notifsData = notifsRes.ok ? await notifsRes.json() : { notifications: [] };

        const users = usersData.users || [];
        const notifs = notifsData.notifications || [];

        setStats({
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'ACTIVE').length,
          suspendedUsers: users.filter(u => u.status === 'SUSPENDED').length,
          totalNotifs: notifs.length,
          unreadNotifs: notifs.filter(n => !n.read).length,
          criticalNotifs: notifs.filter(n => n.type === 'CRITICAL').length,
          roles: {
            Admin: users.filter(u => u.role_name === 'Admin').length,
            'Fleet Manager': users.filter(u => u.role_name === 'Fleet Manager').length,
            Driver: users.filter(u => u.role_name === 'Driver').length,
            'Safety Officer': users.filter(u => u.role_name === 'Safety Officer').length,
            Finance: users.filter(u => u.role_name === 'Finance').length,
          },
          recentUsers: users.slice(0, 5),
        });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="loading-center"><div className="spinner" /> Loading dashboard...</div>;
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <AlertTriangle size={32} />
        <div className="empty-state-title">Could not load dashboard data</div>
        <div className="empty-state-text">Check your connection and refresh the page.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">System status and user activity</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Users size={14} /> Total Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-change positive">
            <TrendingUp size={12} /> {stats.activeUsers} active
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label"><Truck size={14} /> Drivers</div>
          <div className="stat-value">{stats.roles.Driver}</div>
          <div className="stat-change" style={{ color: 'var(--text-2)' }}>
            of {stats.totalUsers} total users
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label"><Bell size={14} /> Notifications</div>
          <div className="stat-value">{stats.totalNotifs}</div>
          {stats.unreadNotifs > 0 && (
            <div className="stat-change negative">
              {stats.unreadNotifs} unread
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label"><AlertTriangle size={14} /> Issues</div>
          <div className="stat-value">{stats.suspendedUsers + stats.criticalNotifs}</div>
          <div className="stat-change" style={{ color: 'var(--text-2)' }}>
            {stats.suspendedUsers} suspended · {stats.criticalNotifs} critical
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Role Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Users by Role</span>
          </div>
          <div className="card-body">
            {Object.entries(stats.roles).map(([role, count]) => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-0)' }}>{role}</span>
                <span className={`badge ${role === 'Admin' ? 'badge-red' : role === 'Fleet Manager' ? 'badge-blue' : role === 'Driver' ? 'badge-green' : role === 'Safety Officer' ? 'badge-purple' : 'badge-amber'}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Users</span>
          </div>
          <div style={{ padding: 0 }}>
            {stats.recentUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="user-cell">
                  <div className="user-avatar">{u.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="user-name">{u.name}</div>
                    <div className="user-email">{u.email}</div>
                  </div>
                </div>
                <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : u.status === 'SUSPENDED' ? 'badge-red' : 'badge-gray'}`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
