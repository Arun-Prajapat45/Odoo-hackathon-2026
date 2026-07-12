"use client";

import React from 'react';
import Link from 'next/link';
import { Truck, Navigation, Users, Wrench, Sparkles, PlusCircle, ArrowRight, Download, Flame, DollarSign, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardClient({ kpis, fuelData, expenseData }) {
  const cards = [
    {
      title: 'Active Vehicles',
      value: kpis.activeVehicles,
      icon: Truck,
      badge: 'On Trip',
      gradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      href: '/vehicles'
    },
    {
      title: 'Active Dispatch Trips',
      value: kpis.activeTrips,
      icon: Navigation,
      badge: 'In Transit',
      gradient: 'from-indigo-600 to-purple-600',
      shadow: 'shadow-indigo-500/25',
      href: '/trips'
    },
    {
      title: 'Available Drivers',
      value: kpis.availableDrivers,
      icon: Users,
      badge: 'Ready to Dispatch',
      gradient: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      href: '/drivers'
    },
    {
      title: 'In Shop / Maintenance',
      value: kpis.maintenanceVehicles,
      icon: Wrench,
      badge: 'Action Needed',
      gradient: 'from-rose-600 to-red-600',
      shadow: 'shadow-rose-500/25',
      href: '/maintenance'
    },
  ];

  const quickActions = [
    { title: 'New Trip Dispatch', desc: 'Assign driver and route', href: '/trips', icon: Navigation, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
    { title: 'Log Fuel Entry', desc: 'Record liters & cost', href: '/fuel', icon: Flame, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
    { title: 'AI Fleet Telemetry', desc: 'Ask Llama 3.3 Copilot', href: '/ai-assistant', icon: Sparkles, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' },
    { title: 'Download CSV Report', desc: 'Export full fleet financials', href: '/api/reports/export', icon: Download, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', isExternal: true }
  ];

  return (
    <div className="space-y-6 w-full">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 w-full">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="saas-card p-5 flex items-center justify-between gap-4 hover:border-blue-500/60 transition-all group relative overflow-hidden"
            >
              <div className="flex-1 min-w-0 z-10">
                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {card.badge}
                </span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mt-1">
                  {card.value}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>{card.title}</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </p>
              </div>

              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg ${card.shadow} group-hover:scale-110 transition-transform shrink-0 z-10`}>
                <Icon size={22} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Shortcuts Banner */}
      <div className="saas-card p-5 w-full bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <PlusCircle size={14} className="text-blue-500" />
            <span>Quick Operational Actions</span>
          </h3>
          <span className="text-sm text-slate-400 font-medium hidden sm:inline">1-Click Fast Workflow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon;
            const Component = qa.isExternal ? 'a' : Link;
            return (
              <Component
                key={i}
                href={qa.href}
                {...(qa.isExternal ? { download: true } : {})}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-3 group w-full"
              >
                <div className={`w-10 h-10 rounded-xl ${qa.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {qa.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {qa.desc}
                  </p>
                </div>
              </Component>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {/* Fuel Consumption Area Chart */}
        <div className="saas-card p-5 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame size={16} className="text-amber-500" />
                <span>Fuel Consumption Trend</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total liters consumed over the past 7 active days</p>
            </div>
            <Link href="/fuel" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              View Log →
            </Link>
          </div>

          <div className="h-64 sm:h-72 w-full mt-auto">
            {fuelData && fuelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fuelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: 600,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_liters"
                    name="Liters Consumed"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFuel)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Flame size={28} className="opacity-40" />
                <p className="text-xs font-semibold">No recent fuel log data recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Expenses Bar Chart */}
        <div className="saas-card p-5 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign size={16} className="text-indigo-500" />
                <span>Daily Operational Expenses ($)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aggregate fleet maintenance and toll costs</p>
            </div>
            <Link href="/expenses" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              View Expenses →
            </Link>
          </div>

          <div className="h-64 sm:h-72 w-full mt-auto">
            {expenseData && expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: 600,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#6366f1' }}
                  />
                  <Bar
                    dataKey="total_amount"
                    name="Daily Cost ($)"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <DollarSign size={28} className="opacity-40" />
                <p className="text-xs font-semibold">No expense records found for the last 7 days</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
