'use client';
import { useState, useEffect, useRef } from 'react';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) setNotifications(json.data);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.read);

  const markRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
      );
    } catch {}
  };

  const typeClass = (type) => {
    if (type === 'CRITICAL') return 'badge-critical';
    if (type === 'WARNING') return 'badge-warning';
    return 'badge-info';
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="notif-bell" onClick={() => { setOpen(!open); fetchNotifs(); }}>
        🔔
        {unread.length > 0 && (
          <span className="notif-dot">{unread.length > 9 ? '9+' : unread.length}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            Notifications
            {unread.length > 0 && (
              <span className="badge badge-critical" style={{ marginLeft: 8 }}>{unread.length} new</span>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <div className="empty-icon">🔕</div>
                <div className="empty-text">No notifications</div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${typeClass(n.type)}`}>{n.type}</span>
                    <span className="notif-item-title">{n.title}</span>
                  </div>
                  <div className="notif-item-msg">{n.message}</div>
                  <div className="notif-item-time">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
