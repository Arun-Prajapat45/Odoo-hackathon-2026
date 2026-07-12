'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Bell, LogOut, Truck, X, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar({ userRole, isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.success) setUnread((d.notifications || []).filter(n => !n.read).length);
      })
      .catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { href: '/dashboard/users', label: 'User Management', icon: Users, roles: ['Admin', 'Fleet Manager'] },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, count: unread },
  ];

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Truck size={18} /></div>
          <div>
            <div className="sidebar-brand-text">TransitOps</div>
            <div className="sidebar-brand-sub">Fleet Management</div>
          </div>
          {isOpen && (
            <button onClick={onClose} className="btn-icon" style={{ marginLeft: 'auto' }}>
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {links.map(link => {
            if (link.roles && !link.roles.includes(userRole) && userRole !== 'Admin') return null;
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
                {link.count > 0 && <span className="badge">{link.count}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="nav-link" style={{ width: '100%', color: 'var(--red)' }}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
