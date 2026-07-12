'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Filter,
  PlusCircle,
  RefreshCw
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'INFO' });
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success || Array.isArray(data.notifications) || Array.isArray(data.data)) {
        setNotifs(data.notifications || data.data || []);
      } else {
        setError(data.error || 'Failed to load system feed.');
      }
    } catch (err) {
      setError('Network error while retrieving notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (n) => {
    try {
      await fetch(`/api/notifications/${n.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !n.read })
      });
      setNotifs(prev => prev.map(item => item.id === n.id ? { ...item, read: !n.read } : item));
    } catch (err) {}
  };

  const deleteNotif = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifs(prev => prev.filter(item => item.id !== id));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const sendNotif = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setShowCompose(false);
        setForm({ title: '', message: '', type: 'INFO' });
        load();
      } else {
        alert(data.error || 'Failed to broadcast notification.');
      }
    } catch (err) {
      alert('Network error while sending notification.');
    } finally {
      setSending(false);
    }
  };

  const filteredNotifs = notifs.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'ALL') return true;
    return n.type === activeTab;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="saas-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-slate-900/5 to-purple-900/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Bell size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Notifications & Alerts</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live dispatch alerts, maintenance warnings, safety infractions, and system broadcasts across TransitOps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => setShowCompose(true)}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <PlusCircle size={15} />
            <span>Broadcast Alert</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn-secondary text-xs py-2 px-3.5 text-blue-600 dark:text-blue-400"
            >
              <CheckCircle2 size={15} />
              <span>Mark All Read</span>
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary p-2"
            title="Refresh feed"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'UNREAD', 'CRITICAL', 'WARNING', 'INFO'].map((tab) => {
            const count = tab === 'ALL' ? notifs.length :
                          tab === 'UNREAD' ? unreadCount :
                          notifs.filter(n => n.type === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{tab === 'UNREAD' ? 'Unread Only' : tab}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Showing {filteredNotifs.length} of {notifs.length} total events
        </span>
      </div>

      {/* Notifications List Feed */}
      {loading ? (
        <div className="saas-card p-12 text-center text-slate-400 dark:text-slate-500">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-sm font-semibold">Loading system feed...</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="saas-card p-16 text-center text-slate-400 dark:text-slate-500 max-w-md mx-auto">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500/70" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No notifications found</h3>
          <p className="text-xs mt-1 text-slate-500">
            {activeTab === 'UNREAD'
              ? 'You have read all your alerts. Check the "ALL" tab to review past events.'
              : `No alerts matching the "${activeTab}" filter currently exist in your feed.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((n) => {
            const isCritical = n.type === 'CRITICAL' || n.type === 'URGENT';
            const isWarning = n.type === 'WARNING';
            return (
              <div
                key={n.id}
                className={`saas-card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  !n.read
                    ? 'border-l-4 border-l-blue-500 bg-blue-50/40 dark:bg-blue-500/[0.04]'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${
                    isCritical ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                    isWarning ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                    'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  }`}>
                    {isCritical ? <AlertTriangle size={20} /> : isWarning ? <AlertCircle size={20} /> : <Info size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                        isCritical ? 'bg-red-500 text-white' :
                        isWarning ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {n.type || 'INFO'}
                      </span>
                      <h4 className={`text-sm md:text-base truncate ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 dark:text-slate-500 font-medium">
                      <span>{n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => toggleRead(n)}
                    className="btn-secondary text-xs py-1.5 px-3"
                    title={n.read ? 'Mark Unread' : 'Mark Read'}
                  >
                    <Check size={14} className={n.read ? 'text-slate-400' : 'text-blue-500'} />
                    <span>{n.read ? 'Unread' : 'Read'}</span>
                  </button>
                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-blue-500" />
                <span>Broadcast Fleet Alert</span>
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={sendNotif} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Alert Severity / Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['INFO', 'WARNING', 'CRITICAL'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                        form.type === type
                          ? type === 'CRITICAL' ? 'bg-red-500 text-white border-red-500 shadow-sm' :
                            type === 'WARNING' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' :
                            'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Title / Subject
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Mandatory Fleet Inspection Tomorrow"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Detailed Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Provide complete details, vehicle ID, or dispatch instructions..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary px-5 py-2"
                >
                  <Send size={16} />
                  <span>{sending ? 'Broadcasting...' : 'Send Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
