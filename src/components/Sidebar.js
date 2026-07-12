'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';

const NAV = [
  { href: '/drivers',     icon: '🚗', label: 'Drivers' },
  { href: '/maintenance', icon: '🔧', label: 'Maintenance' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🚛</div>
          <div className="logo-text">Transit<span>Ops</span></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Operations</div>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-link ${pathname.startsWith(n.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
