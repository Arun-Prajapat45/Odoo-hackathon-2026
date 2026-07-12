'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Check, Trash2, Send, X, AlertCircle, BellOff } from 'lucide-react';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'INFO' });
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) setNotifs(data.notifications || []);
      else setError(data.error);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleRead = async (n) => {
    try {
      await fetch(`/api/notifications/${n.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !n.read }),
      });
      load();
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      load();
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.read);
    await Promise.all(unread.map(n =>
      fetch(`/api/notifications/${n.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
    ));
    load();
  };

  const sendNotif = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowCompose(false);
        setForm({ title: '', message: '', type: 'INFO' });
        load();
      } else {
        alert(data.error || 'Failed to send');
      }
    } catch {
      alert('Network error');
    } finally {
      setSending(false);
    }
  };

  const iconClass = (type) => {
    if (type === 'CRITICAL') return 'notif-icon critical';
    if (type === 'WARNING') return 'notif-icon warning';
    return 'notif-icon info';
  };

  const getIcon = (type) => {
    if (type === 'CRITICAL') return <AlertTriangle size={16} />;
    if (type === 'WARNING') return <AlertCircle size={16} />;
    return <Info size={16} />;
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Notifications
              {unreadCount > 0 && <span className="badge badge-red" style={{ marginLeft: 8, fontSize: 11, verticalAlign: 'middle' }}>{unreadCount}</span>}
            </h1>
            <p className="page-subtitle">System alerts and messages</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button className="btn btn-ghost" onClick={markAllRead}>
                <Check size={14} /> Mark all read
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowCompose(!showCompose)}>
              <Send size={14} /> Send Alert
            </button>
          </div>
        </div>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">New Notification</span>
            <button className="btn-icon" onClick={() => setShowCompose(false)}><X size={14} /></button>
          </div>
          <form onSubmit={sendNotif}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Title</label>
                  <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Severity</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Message</label>
                <textarea className="form-input" required rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Notification details..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /> Loading notifications...</div>
        ) : error ? (
          <div className="empty-state">
            <AlertCircle size={28} />
            <div className="empty-state-title">{error}</div>
          </div>
        ) : notifs.length === 0 ? (
          <div className="empty-state">
            <BellOff size={28} />
            <div className="empty-state-title">No notifications</div>
            <div className="empty-state-text">You&apos;re all caught up.</div>
          </div>
        ) : (
          <div>
            {notifs.map(n => (
              <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                <div className={iconClass(n.type)}>
                  {getIcon(n.type)}
                </div>
                <div className="notif-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="notif-title">{n.title}</span>
                    <span className={`badge ${n.type === 'CRITICAL' ? 'badge-red' : n.type === 'WARNING' ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: 10 }}>
                      {n.type}
                    </span>
                  </div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time">{n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}</div>
                </div>
                <div className="notif-actions">
                  <button
                    className="btn-icon"
                    onClick={() => toggleRead(n)}
                    title={n.read ? 'Mark unread' : 'Mark read'}
                    style={{ color: n.read ? 'var(--text-2)' : 'var(--accent)' }}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => deleteNotif(n.id)}
                    title="Delete"
                    style={{ color: 'var(--red)', borderColor: 'transparent' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
