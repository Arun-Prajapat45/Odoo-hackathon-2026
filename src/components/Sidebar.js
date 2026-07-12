'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, LayoutDashboard, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Vehicles', href: '/vehicles', icon: Truck, activePattern: /^\/vehicles/ },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck size={24} color="#3b82f6" />
          <span>Transit<span>Ops</span></span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} title="Close Menu">
          <X size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.activePattern 
            ? item.activePattern.test(pathname)
            : pathname === item.href;
            
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose} // Auto close menu on navigations on mobile
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
        TransitOps v1.0.0
      </div>
    </aside>
  );
}
