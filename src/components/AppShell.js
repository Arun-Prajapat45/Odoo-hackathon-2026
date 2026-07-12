'use client';

import React from 'react';

/**
 * AppShell - Page wrapper component used by driver and maintenance details pages.
 */
export default function AppShell({ title, children }) {
  return (
    <div className="app-shell-container" style={{ width: '100%' }}>
      {title && (
        <div className="app-shell-header" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h1>
        </div>
      )}
      <div className="app-shell-content">
        {children}
      </div>
    </div>
  );
}
