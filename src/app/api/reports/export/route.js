import { NextResponse } from 'next/server';
import { queryDb, safeQuery } from '@/lib/db';

export async function GET(request) {
  try {
    const [vehicles, fuelLogs, maintenances, expenses, trips] = await Promise.all([
      safeQuery('SELECT id, status, purchase_cost FROM vehicle', [], []),
      safeQuery('SELECT liters, total_cost FROM fuel_log', [], []),
      safeQuery('SELECT cost FROM maintenance', [], []),
      safeQuery('SELECT amount FROM expense', [], []),
      safeQuery("SELECT actual_distance, revenue FROM trip WHERE status = 'COMPLETED'", [], []),
    ]);

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => ['AVAILABLE', 'ON_TRIP'].includes(v.status)).length;
    const utilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;
    
    const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.purchase_cost || 0), 0);
    const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.total_cost || 0), 0);
    const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalOtherExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const totalDistance = trips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
    const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
    
    const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
    const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0;
    const profit = totalRevenue - operationalCost;
    const vehicleROI = totalAcquisitionCost > 0 ? ((profit / totalAcquisitionCost) * 100).toFixed(2) : 0;

    let csv = 'Metric,Value (INR / Units)\n';
    csv += `Total Fleet Size,${totalVehicles}\n`;
    csv += `Active & Operational Vehicles,${activeVehicles}\n`;
    csv += `Fleet Utilization (%),${utilization}%\n`;
    csv += `Total Distance Traversed (km),${totalDistance}\n`;
    csv += `Total Fuel Consumed (Liters),${totalFuelLiters.toFixed(2)}\n`;
    csv += `Weighted Fuel Efficiency (km/L),${fuelEfficiency}\n`;
    csv += `Total Gross Revenue (INR),${totalRevenue.toFixed(2)}\n`;
    csv += `Total Fuel Expenditure (INR),${totalFuelCost.toFixed(2)}\n`;
    csv += `Total Maintenance Expenditure (INR),${totalMaintenanceCost.toFixed(2)}\n`;
    csv += `Total Tolls & Other Expenses (INR),${totalOtherExpenses.toFixed(2)}\n`;
    csv += `Total Cumulative Operational Cost (INR),${operationalCost.toFixed(2)}\n`;
    csv += `Net Profit / Loss (INR),${profit.toFixed(2)}\n`;
    csv += `Total Fleet Capital Acquisition Cost (INR),${totalAcquisitionCost.toFixed(2)}\n`;
    csv += `Overall Capital Return ROI (%),${vehicleROI}%\n`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="transitops_fleet_analytics_report.csv"'
      }
    });
  } catch (err) {
    console.error('[CSV Export Error]', err);
    return NextResponse.json({ error: 'Failed to generate CSV report.' }, { status: 500 });
  }
}
