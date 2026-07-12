'use client';

import { Menu, User } from 'lucide-react';
import ThemeToggle from './ThemeSelector';

const ROLE_BADGE = {
  Admin: 'badge-red',
  'Fleet Manager': 'badge-blue',
  Driver: 'badge-green',
  'Safety Officer': 'badge-purple',
  Finance: 'badge-amber',
};

export default function Header({ userEmail, userRole, onOpenSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onOpenSidebar}>
          <Menu size={18} />
        </button>
      </div>

      <div className="topbar-right">
        <ThemeToggle />
        <div className="topbar-user">
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent-subtle)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700
          }}>
            <User size={14} />
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{userEmail}</span>
            <span className="topbar-user-role">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
