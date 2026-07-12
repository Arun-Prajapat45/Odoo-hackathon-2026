"use client";

import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    depotName: 'Gandhinagar Depot GJ4',
    currency: 'INR (₹)',
    distanceUnit: 'Kilometers'
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const rbacMatrix = [
    { role: 'Fleet Manager', fleet: '✓', drivers: '✓', trips: '—', fuelExp: '—', analytics: '✓' },
    { role: 'Dispatcher', fleet: 'View', drivers: '—', trips: '✓', fuelExp: '—', analytics: '—' },
    { role: 'Safety Officer', fleet: '—', drivers: '✓', trips: 'View', fuelExp: '—', analytics: '—' },
    { role: 'Financial Analyst', fleet: 'View', drivers: '—', trips: '—', fuelExp: '✓', analytics: '✓' }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/10 via-slate-800/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-500/25">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Platform Settings & Security</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure general platform preferences and view Role-Based Access Control (RBAC) permissions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* General Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5">General</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Depot Name</label>
                <input 
                  type="text" 
                  value={formData.depotName}
                  onChange={(e) => setFormData({...formData, depotName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currency</label>
                <input 
                  type="text" 
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Distance Unit</label>
                <input 
                  type="text" 
                  value={formData.distanceUnit}
                  onChange={(e) => setFormData({...formData, distanceUnit: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="btn-primary w-full bg-blue-600 hover:bg-blue-700 py-3 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Changes Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RBAC Matrix */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" />
              Role-Based Access (RBAC)
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Fleet</th>
                    <th className="py-3 px-4 text-center">Drivers</th>
                    <th className="py-3 px-4 text-center">Trips</th>
                    <th className="py-3 px-4 text-center">Fuel/Exp.</th>
                    <th className="py-3 px-4 text-center">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {rbacMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">{row.role}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600 dark:text-slate-400">{row.fleet}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600 dark:text-slate-400">{row.drivers}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600 dark:text-slate-400">{row.trips}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600 dark:text-slate-400">{row.fuelExp}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600 dark:text-slate-400">{row.analytics}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                <strong>Note:</strong> ✓ indicates full read/write access. 'View' indicates read-only access. '—' indicates no access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
