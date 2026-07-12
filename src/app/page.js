import { queryDb, safeQuery } from '@/lib/db';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  try {
    const [activeVehiclesRes, activeTripsRes, availableDriversRes, maintenanceRes, fuelChartRes, expenseChartRes] = await Promise.all([
      safeQuery("SELECT COUNT(*) as count FROM vehicle WHERE status = 'ON_TRIP'", [], [{ count: 0 }]),
      safeQuery("SELECT COUNT(*) as count FROM trip WHERE status = 'DISPATCHED'", [], [{ count: 0 }]),
      safeQuery("SELECT COUNT(*) as count FROM driver WHERE status = 'AVAILABLE'", [], [{ count: 0 }]),
      safeQuery("SELECT COUNT(*) as count FROM vehicle WHERE status = 'IN_SHOP'", [], [{ count: 0 }]),
      safeQuery("SELECT date, SUM(liters) as total_liters FROM fuel_log GROUP BY date ORDER BY date DESC LIMIT 7", [], []),
      safeQuery("SELECT date, SUM(amount) as total_amount FROM expense GROUP BY date ORDER BY date DESC LIMIT 7", [], [])
    ]);

    const kpis = {
      activeVehicles: activeVehiclesRes?.[0]?.count || 0,
      activeTrips: activeTripsRes?.[0]?.count || 0,
      availableDrivers: availableDriversRes?.[0]?.count || 0,
      maintenanceVehicles: maintenanceRes?.[0]?.count || 0,
    };

    const fuelData = (fuelChartRes || []).reverse();
    const expenseData = (expenseChartRes || []).reverse();

    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fleet Command Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time telemetry, operational status, and financial KPIs</p>
          </div>
        </div>
        <DashboardClient kpis={kpis} fuelData={fuelData} expenseData={expenseData} />
      </div>
    );
  } catch (err) {
    console.error(err);
    return (
      <div className="p-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm">
        <h2 className="font-bold text-base text-red-700 dark:text-red-300">Error loading dashboard telemetry</h2>
        <p className="text-sm mt-1 text-red-600/80 dark:text-red-400/80">Could not connect to the database endpoint or query failed.</p>
        <p className="text-xs mt-2 text-red-500/80 font-mono bg-white/50 dark:bg-black/20 p-2 rounded-lg">{err.message}</p>
      </div>
    );
  }
}
