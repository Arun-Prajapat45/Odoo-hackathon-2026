import { queryDb } from '@/lib/db';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  try {
    const activeVehiclesRes = await queryDb("SELECT COUNT(*) as count FROM vehicle WHERE status = 'ON_TRIP'");
    const activeTripsRes = await queryDb("SELECT COUNT(*) as count FROM trip WHERE status = 'DISPATCHED'");
    const availableDriversRes = await queryDb("SELECT COUNT(*) as count FROM driver WHERE status = 'AVAILABLE'");
    const maintenanceRes = await queryDb("SELECT COUNT(*) as count FROM vehicle WHERE status = 'IN_SHOP'");

    const fuelChartRes = await queryDb("SELECT date, SUM(liters) as total_liters FROM fuel_log GROUP BY date ORDER BY date DESC LIMIT 7");
    const expenseChartRes = await queryDb("SELECT date, SUM(amount) as total_amount FROM expense GROUP BY date ORDER BY date DESC LIMIT 7");

    const kpis = {
      activeVehicles: activeVehiclesRes?.[0]?.count || 0,
      activeTrips: activeTripsRes?.[0]?.count || 0,
      availableDrivers: availableDriversRes?.[0]?.count || 0,
      maintenanceVehicles: maintenanceRes?.[0]?.count || 0,
    };

    const fuelData = (fuelChartRes || []).reverse();
    const expenseData = (expenseChartRes || []).reverse();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time overview of your fleet operations</p>
        </div>
        <DashboardClient kpis={kpis} fuelData={fuelData} expenseData={expenseData} />
      </div>
    );
  } catch (err) {
    console.error(err);
    return (
      <div className="p-6 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
        <h2 className="font-bold text-red-300">Error loading dashboard</h2>
        <p className="text-sm mt-1 text-red-400/80">Could not connect to the database endpoint or query failed.</p>
        <p className="text-xs mt-2 text-red-500/60 font-mono">{err.message}</p>
      </div>
    );
  }
}
