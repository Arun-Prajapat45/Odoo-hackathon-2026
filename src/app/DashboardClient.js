"use client";

import { Truck, Navigation, Users, Wrench } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardClient({ kpis, fuelData, expenseData }) {
  const cards = [
    { title: 'Active Vehicles', value: kpis.activeVehicles, icon: Truck, color: 'bg-blue-500' },
    { title: 'Active Trips', value: kpis.activeTrips, icon: Navigation, color: 'bg-indigo-500' },
    { title: 'Available Drivers', value: kpis.availableDrivers, icon: Users, color: 'bg-emerald-500' },
    { title: 'In Maintenance', value: kpis.maintenanceVehicles, icon: Wrench, color: 'bg-rose-500' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-slate-500 text-sm font-medium">{card.title}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Fuel Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Fuel Consumption (Last 7 Days)</h3>
          <div className="h-72">
            {fuelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fuelData}>
                  <defs>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="total_liters" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFuel)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No fuel data available</div>
            )}
          </div>
        </div>

        {/* Expense Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Daily Expenses</h3>
          <div className="h-72">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total_amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No expense data available</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
