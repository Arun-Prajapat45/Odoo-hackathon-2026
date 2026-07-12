'use client';

import { useState } from 'react';
import { ThemeProvider } from './ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardShell({ userRole, userEmail, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="app-layout">
        <Sidebar
          userRole={userRole}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="main-area">
          <Header
            userEmail={userEmail}
            userRole={userRole}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
