import { queryDb } from '@/lib/db';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const vehiclesRes = await queryDb('SELECT id, status, purchase_cost FROM vehicle');
  const vehicles = vehiclesRes || [];
  
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => ['AVAILABLE', 'ON_TRIP'].includes(v.status)).length;
  const utilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;
  
  const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.purchase_cost || 0), 0);

  const fuelRes = await queryDb('SELECT liters, total_cost, odometer FROM fuel_log');
  const fuelLogs = fuelRes || [];
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.total_cost || 0), 0);

  const maintRes = await queryDb('SELECT cost FROM maintenance');
  const maintenances = maintRes || [];
  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

  const expRes = await queryDb('SELECT amount FROM expense');
  const expenses = expRes || [];
  const totalOtherExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const tripRes = await queryDb("SELECT actual_distance, revenue FROM trip WHERE status = 'COMPLETED'");
  const trips = tripRes || [];
  const totalDistance = trips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

  const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0;
  const profit = totalRevenue - operationalCost;
  const vehicleROI = totalAcquisitionCost > 0 ? ((profit / totalAcquisitionCost) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Financial performance and fleet metrics</p>
        </div>
        <Link 
          href="/api/reports/export"
          target="_blank"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Download size={16} /> Export CSV
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-3 text-slate-500 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Activity size={16} className="text-blue-400" /></div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">Fleet Utilization</h3>
          </div>
          <p className="text-3xl font-bold text-white">{utilization}%</p>
          <p className="text-xs text-slate-500 mt-2">{activeVehicles} of {totalVehicles} vehicles active</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-3 text-slate-500 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><DollarSign size={16} className="text-amber-400" /></div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">Operational Cost</h3>
          </div>
          <p className="text-3xl font-bold text-white">${operationalCost.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-2">Fuel, Maintenance & Tolls</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-3 text-slate-500 mb-3">
            <div className="p-2 rounded-lg bg-indigo-500/10"><BarChart3 size={16} className="text-indigo-400" /></div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">Fuel Efficiency</h3>
          </div>
          <p className="text-3xl font-bold text-white">{fuelEfficiency} <span className="text-lg font-medium text-slate-500">km/L</span></p>
          <p className="text-xs text-slate-500 mt-2">{totalDistance} km total distance</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-3 text-slate-500 mb-3">
            <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {profit >= 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">Overall ROI</h3>
          </div>
          <p className={`text-3xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{vehicleROI}%</p>
          <p className="text-xs text-slate-500 mt-2">On ${totalAcquisitionCost.toLocaleString()} acquisition</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="p-5 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Summary Metrics</h2>
        </div>
        <table className="w-full text-left text-sm">
          <tbody>
            <tr className="border-b border-slate-800/40">
              <td className="px-6 py-4 font-medium text-slate-400">Total Revenue</td>
              <td className="px-6 py-4 font-bold text-white">${totalRevenue.toLocaleString()}</td>
            </tr>
            <tr className="border-b border-slate-800/40">
              <td className="px-6 py-4 font-medium text-slate-400">Total Operational Cost</td>
              <td className="px-6 py-4 font-bold text-white">${operationalCost.toLocaleString()}</td>
            </tr>
            <tr className="border-b border-slate-800/40">
              <td className="px-6 py-4 font-medium text-slate-400">Total Profit / Loss</td>
              <td className={`px-6 py-4 font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${profit.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium text-slate-400">Total Fleet Acquisition Cost</td>
              <td className="px-6 py-4 font-bold text-white">${totalAcquisitionCost.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
