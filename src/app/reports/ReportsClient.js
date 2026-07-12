"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export default function ReportsClient({ statCards, topCostliestVehicles, monthlyRevenueData }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon === 'Activity' ? Activity :
                       card.icon === 'DollarSign' ? DollarSign :
                       card.icon === 'BarChart3' ? BarChart3 :
                       card.icon === 'TrendingUp' ? TrendingUp : TrendingDown;
          
          return (
            <div key={idx} className="glass-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color.split(' ')[0]} ${card.color.split(' ')[1]} flex items-center justify-center text-white shadow-md`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-3xl font-extrabold ${card.color.split(' ').slice(2).join(' ')}`}>{card.value}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {/* Monthly Revenue Chart */}
        <div className="glass-card p-5 flex flex-col h-[350px]">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            {monthlyRevenueData && monthlyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold">No revenue data available</div>
            )}
          </div>
        </div>

        {/* Top Costliest Vehicles */}
        <div className="glass-card p-5 flex flex-col h-[350px]">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Costliest Vehicles</h3>
            <p className="text-[10px] text-slate-500 mt-1">Based on fuel and maintenance cost</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            {topCostliestVehicles && topCostliestVehicles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCostliestVehicles} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} width={80} />
                  <Tooltip
                    cursor={{ fill: 'rgba(239, 68, 68, 0.08)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="cost" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={30} name="Total Cost (₹)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold">No cost data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
