'use client';

import React from 'react';

export default function AppShell({ title, children }) {
  return (
    <div className="w-full space-y-6">
      {title && (
        <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
