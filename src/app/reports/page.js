import React from 'react';
import { queryDb, safeQuery } from '@/lib/db';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Activity, PieChart, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [vehiclesRes, fuelRes, maintRes, expRes, tripRes] = await Promise.all([
    safeQuery('SELECT id, registration_number, vehicle_name, status, purchase_cost FROM vehicle', [], []),
    safeQuery('SELECT vehicle_id, liters, total_cost, odometer FROM fuel_log', [], []),
    safeQuery('SELECT vehicle_id, cost FROM maintenance', [], []),
    safeQuery('SELECT amount FROM expense', [], []),
    safeQuery("SELECT actual_distance, revenue, actual_end FROM trip WHERE status = 'COMPLETED'", [], []),
  ]);

  const vehicles = vehiclesRes || [];
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => ['AVAILABLE', 'ON_TRIP'].includes(v.status)).length;
  const utilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;
  const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.purchase_cost || 0), 0);

  const fuelLogs = fuelRes || [];
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.total_cost || 0), 0);

  const maintenances = maintRes || [];
  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

  const expenses = expRes || [];
  const totalOtherExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const trips = tripRes || [];
  const totalDistance = trips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

  const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0;
  const profit = totalRevenue - operationalCost;
  const vehicleROI = totalAcquisitionCost > 0 ? ((profit / totalAcquisitionCost) * 100).toFixed(2) : 0;

  // Analytics Calculations
  const vehicleCosts = {};
  vehicles.forEach(v => {
    vehicleCosts[v.id] = { name: v.registration_number || `Vehicle ${v.id}`, cost: 0 };
  });
  fuelLogs.forEach(f => {
    if (f.vehicle_id && vehicleCosts[f.vehicle_id]) vehicleCosts[f.vehicle_id].cost += (f.total_cost || 0);
  });
  maintenances.forEach(m => {
    if (m.vehicle_id && vehicleCosts[m.vehicle_id]) vehicleCosts[m.vehicle_id].cost += (m.cost || 0);
  });
  const topCostliestVehicles = Object.values(vehicleCosts)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3);

  const monthlyRevenue = {};
  trips.forEach(t => {
    if (t.actual_end) {
      const d = new Date(t.actual_end);
      const month = d.toLocaleString('default', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (t.revenue || 0);
    }
  });
  const monthlyRevenueData = Object.keys(monthlyRevenue).map(month => ({
    month,
    revenue: monthlyRevenue[month]
  }));

  const statCards = [
    {
      title: 'Fleet Operational Utilization',
      value: `${utilization}%`,
      sub: `${activeVehicles} of ${totalVehicles} units active & available`,
      icon: 'Activity',
      color: 'from-blue-600 to-indigo-600 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Operational Outlay',
      value: `₹${operationalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: 'Cumulative fuel, maintenance & toll vouchers',
      icon: 'DollarSign',
      color: 'from-amber-500 to-orange-600 text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Fleet Fuel Efficiency',
      value: `${fuelEfficiency} km/L`,
      sub: `Across ${totalDistance.toLocaleString()} km traversed distance`,
      icon: 'BarChart3',
      color: 'from-purple-600 to-pink-600 text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Net Fleet Capital ROI',
      value: `${vehicleROI}%`,
      sub: `On ₹${totalAcquisitionCost.toLocaleString()} acquisition basis`,
      icon: profit >= 0 ? 'TrendingUp' : 'TrendingDown',
      color: profit >= 0 ? 'from-emerald-600 to-teal-600 text-emerald-600 dark:text-emerald-400' : 'from-red-600 to-rose-600 text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <PieChart size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Financial Intelligence & Fleet Analytics</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                Live Audit
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Audit operational expenditures against trip revenues, calculate return on investment (ROI), and download financial statements.
            </p>
          </div>
        </div>

        <Link 
          href="/api/reports/export"
          target="_blank"
          className="btn-primary py-2.5 px-4 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 self-end sm:self-center shrink-0 flex items-center gap-2"
        >
          <Download size={16} />
          <span>Download Fleet CSV Report</span>
        </Link>
      </div>

      <ReportsClient 
        statCards={statCards} 
        topCostliestVehicles={topCostliestVehicles} 
        monthlyRevenueData={monthlyRevenueData} 
      />

      {/* Financial Breakdown Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-500" />
            <span>Comprehensive Financial Performance Ledger</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-500">Currency: INR (₹)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/20 dark:bg-slate-800/20">
                <th className="py-3.5 px-6">Metric Description</th>
                <th className="py-3.5 px-6 text-right">Computed Value</th>
                <th className="py-3.5 px-6">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-semibold">
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Total Completed Trip Gross Revenue</td>
                <td className="py-4 px-6 text-right font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  + ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-6"><span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold">Revenue</span></td>
              </tr>

              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Total Fuel & Refueling Receipts Outlay</td>
                <td className="py-4 px-6 text-right font-bold text-amber-600 dark:text-amber-400 font-mono">
                  - ₹{totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-6"><span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] uppercase font-bold">Operational Expense</span></td>
              </tr>

              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Total Shop Maintenance & Parts Outlay</td>
                <td className="py-4 px-6 text-right font-bold text-blue-600 dark:text-blue-400 font-mono">
                  - ₹{totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-6"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] uppercase font-bold">Operational Expense</span></td>
              </tr>

              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Total Tolls, Permits & Sundry Vouchers</td>
                <td className="py-4 px-6 text-right font-bold text-purple-600 dark:text-purple-400 font-mono">
                  - ₹{totalOtherExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-6"><span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] uppercase font-bold">Operational Expense</span></td>
              </tr>

              <tr className="bg-slate-50 dark:bg-slate-800/40 font-extrabold border-t-2 border-slate-200 dark:border-slate-700">
                <td className="py-4 px-6 text-slate-900 dark:text-white">Net Operating Profit / Loss Balance</td>
                <td className={`py-4 px-6 text-right font-mono text-base ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {profit >= 0 ? '+' : ''} ₹{profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${profit >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {profit >= 0 ? 'Net Surplus' : 'Net Deficit'}
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Total Fleet Capital Acquisition Basis</td>
                <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white font-mono">
                  ₹{totalAcquisitionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-6"><span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold">Capital Asset</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
