'use client';

import React from 'react';

export default function NotificationPanel({ notifications = [], onToggleRead, onDelete, onMarkAllRead, loading }) {
  const getTypeColor = (type) => {
    switch (type) {
      case 'CRITICAL': return '#ef4444';
      case 'WARNING': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'CRITICAL': return '🚨';
      case 'WARNING': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Dispatch & System Feed</h2>
          {unreadCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '2px 10px', borderRadius: '12px' }}>
              {unreadCount} UNREAD
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            ✔ Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading notification feed...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔔</div>
          <div style={{ fontWeight: 700 }}>All caught up!</div>
          <div style={{ fontSize: '0.85rem' }}>No pending system notices or dispatch warnings in your feed.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {notifications.map((notif) => {
            const color = getTypeColor(notif.type);
            return (
              <div
                key={notif.id}
                style={{
                  background: notif.read ? 'rgba(0,0,0,0.15)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${notif.read ? 'var(--border-color)' : color}`,
                  borderLeft: `5px solid ${color}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', flex: 1 }}>
                  <span style={{ fontSize: '1.5rem' }}>{getIcon(notif.type)}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color, textTransform: 'uppercase' }}>
                        [{notif.type || 'INFO'}]
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: notif.read ? 600 : 800, color: notif.read ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                      )}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: notif.read ? 'var(--text-muted)' : 'var(--text-main)', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Received at: {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => onToggleRead(notif.id, notif.read)}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                    title={notif.read ? 'Mark Unread' : 'Mark Read'}
                  >
                    {notif.read ? '👁️ Mark Unread' : '✔ Mark Read'}
                  </button>
                  <button
                    onClick={() => onDelete(notif.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                    title="Delete notification"
                  >
                    ✖
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
