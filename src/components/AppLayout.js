'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-content">
        {/* Floating mobile menu trigger */}
        <button 
          className="menu-toggle-btn floating-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
