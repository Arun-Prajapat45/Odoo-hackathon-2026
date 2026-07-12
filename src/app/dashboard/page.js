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
    return <div className="flex h-full items-center justify-center text-slate-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mr-3" /> Loading dashboard...</div>;
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <AlertTriangle size={32} className="text-amber-500 mb-4" />
        <div className="text-lg font-semibold text-slate-900 dark:text-white">Could not load dashboard data</div>
        <div className="text-sm mt-1">Check your connection and refresh the page.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
        <p className="text-slate-500 mt-1">System status and user activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2"><Users size={14} /> Total Users</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.totalUsers}</div>
          <div className="text-sm flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={12} /> {stats.activeUsers} active
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2"><Truck size={14} /> Drivers</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.roles.Driver}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            of {stats.totalUsers} total users
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2"><Bell size={14} /> Notifications</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.totalNotifs}</div>
          {stats.unreadNotifs > 0 && (
            <div className="text-sm flex items-center gap-1 text-red-600 dark:text-red-400">
              {stats.unreadNotifs} unread
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2"><AlertTriangle size={14} /> Issues</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.suspendedUsers + stats.criticalNotifs}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {stats.suspendedUsers} suspended · {stats.criticalNotifs} critical
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">Users by Role</h3>
          </div>
          <div className="p-5">
            {Object.entries(stats.roles).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{role}</span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Users</h3>
          </div>
          <div>
            {stats.recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : u.status === 'SUSPENDED' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
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
