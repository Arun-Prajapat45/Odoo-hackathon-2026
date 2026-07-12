import { queryDb } from '@/lib/db';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  // Fetch vehicles for utilization and ROI
  const vehiclesRes = await queryDb('SELECT id, status, purchase_cost FROM vehicle');
  const vehicles = vehiclesRes || [];
  
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => ['AVAILABLE', 'ON_TRIP'].includes(v.status)).length;
  const utilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;
  
  const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.purchase_cost || 0), 0);

  // Fetch fuel logs
  const fuelRes = await queryDb('SELECT liters, total_cost, odometer FROM fuel_log');
  const fuelLogs = fuelRes || [];
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.total_cost || 0), 0);

  // Fetch maintenance costs
  const maintRes = await queryDb('SELECT cost FROM maintenance');
  const maintenances = maintRes || [];
  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

  // Fetch expenses
  const expRes = await queryDb('SELECT amount FROM expense');
  const expenses = expRes || [];
  const totalOtherExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Fetch trips for revenue and distance
  const tripRes = await queryDb("SELECT actual_distance, revenue FROM trip WHERE status = 'COMPLETED'");
  const trips = tripRes || [];
  const totalDistance = trips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

  // Calculations
  const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0; // km per liter
  const profit = totalRevenue - operationalCost;
  
  // ROI = (Profit / Acquisition Cost) * 100
  const vehicleROI = totalAcquisitionCost > 0 ? ((profit / totalAcquisitionCost) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Financial performance and fleet metrics</p>
        </div>
        <Link 
          href="/api/reports/export"
          target="_blank"
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} /> Export CSV
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fleet Utilization */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Activity size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Fleet Utilization</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{utilization}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{activeVehicles} of {totalVehicles} vehicles active</p>
        </div>

        {/* Operational Cost */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <DollarSign size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Operational Cost</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">${operationalCost.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Fuel, Maintenance & Tolls</p>
        </div>

        {/* Fuel Efficiency */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <BarChart3 size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Fuel Efficiency</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{fuelEfficiency} <span className="text-lg font-medium text-slate-500">km/L</span></p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{totalDistance} km total distance</p>
        </div>

        {/* Vehicle ROI */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            {profit >= 0 ? <TrendingUp size={18} className="text-green-500" /> : <TrendingDown size={18} className="text-red-500" />}
            <h3 className="text-sm font-semibold uppercase tracking-wider">Overall ROI</h3>
          </div>
          <p className={`text-3xl font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {vehicleROI}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">On ${totalAcquisitionCost.toLocaleString()} acquisition</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Summary Metrics</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">Total Revenue</td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">Total Operational Cost</td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${operationalCost.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">Total Profit / Loss</td>
                <td className={`px-6 py-4 font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${profit.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">Total Fleet Acquisition Cost</td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${totalAcquisitionCost.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
