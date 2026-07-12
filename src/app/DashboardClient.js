"use client";

import { Truck, Navigation, Users, Wrench } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardClient({ kpis, fuelData, expenseData }) {
  const cards = [
    { title: 'Active Vehicles', value: kpis.activeVehicles, icon: Truck, gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { title: 'Active Trips', value: kpis.activeTrips, icon: Navigation, gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/20' },
    { title: 'Available Drivers', value: kpis.availableDrivers, icon: Users, gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { title: 'In Maintenance', value: kpis.maintenanceVehicles, icon: Wrench, gradient: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/20' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-slate-900 rounded-xl border border-slate-800/60 p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-200 group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg ${card.shadow} group-hover:scale-105 transition-transform`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{card.title}</p>
              <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* Fuel Chart */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800/60">
          <h3 className="text-sm font-semibold text-white mb-5">Fuel Consumption <span className="text-slate-500 font-normal">(Last 7 Days)</span></h3>
          <div className="h-64">
            {fuelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fuelData}>
                  <defs>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip
                    contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: 12}}
                    itemStyle={{color: '#93c5fd'}}
                    cursor={{stroke: '#334155'}}
                  />
                  <Area type="monotone" dataKey="total_liters" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFuel)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No fuel data available</div>
            )}
          </div>
        </div>

        {/* Expense Chart */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800/60">
          <h3 className="text-sm font-semibold text-white mb-5">Daily Expenses</h3>
          <div className="h-64">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip
                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                    contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: 12}}
                    itemStyle={{color: '#a5b4fc'}}
                  />
                  <Bar dataKey="total_amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No expense data available</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
