import { executeQuery } from '../lib/db';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  try {
    // 1. Fetch KPIs
    const activeVehiclesRes = await executeQuery("SELECT COUNT(*) as count FROM vehicle WHERE status = 'ON_TRIP'");
    const activeTripsRes = await executeQuery("SELECT COUNT(*) as count FROM trip WHERE status = 'DISPATCHED'");
    const availableDriversRes = await executeQuery("SELECT COUNT(*) as count FROM driver WHERE status = 'AVAILABLE'");
    const maintenanceRes = await executeQuery("SELECT COUNT(*) as count FROM vehicle WHERE status = 'IN_SHOP'");

    // 2. Fetch Chart Data (Mock or basic group if data exists)
    // For SQLite, getting last 7 days fuel logs:
    const fuelChartRes = await executeQuery("SELECT date, SUM(liters) as total_liters FROM fuel_log GROUP BY date ORDER BY date DESC LIMIT 7");
    const expenseChartRes = await executeQuery("SELECT date, SUM(amount) as total_amount FROM expense GROUP BY date ORDER BY date DESC LIMIT 7");

    const kpis = {
      activeVehicles: activeVehiclesRes?.data?.[0]?.count || 0,
      activeTrips: activeTripsRes?.data?.[0]?.count || 0,
      availableDrivers: availableDriversRes?.data?.[0]?.count || 0,
      maintenanceVehicles: maintenanceRes?.data?.[0]?.count || 0,
    };

    const fuelData = (fuelChartRes?.data || []).reverse();
    const expenseData = (expenseChartRes?.data || []).reverse();

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <DashboardClient kpis={kpis} fuelData={fuelData} expenseData={expenseData} />
      </div>
    );
  } catch (err) {
    console.error(err);
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
        <h2 className="font-bold">Error loading dashboard</h2>
        <p>Could not connect to the database endpoint or query failed.</p>
        <p className="text-sm mt-2 opacity-80">{err.message}</p>
      </div>
    );
  }
}
