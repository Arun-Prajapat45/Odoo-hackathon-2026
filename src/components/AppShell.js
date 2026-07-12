'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';

export default function AppShell({ children, title }) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    const initDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    setIsDark(initDark);
    if (initDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const NAV = [
    { href: '/drivers', icon: '🧑‍✈️', label: 'Drivers' },
    { href: '/maintenance', icon: '🔧', label: 'Maintenance' },
  ];

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

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <NotificationBell />
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
