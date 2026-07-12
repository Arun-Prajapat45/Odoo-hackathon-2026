import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request) {
  try {
    // Collect all data
    const vehicles = (await queryDb('SELECT id, status, purchase_cost FROM vehicle')) || [];
    const fuelLogs = (await queryDb('SELECT liters, total_cost FROM fuel_log')) || [];
    const maintenances = (await queryDb('SELECT cost FROM maintenance')) || [];
    const expenses = (await queryDb('SELECT amount FROM expense')) || [];
    const trips = (await queryDb("SELECT actual_distance, revenue FROM trip WHERE status = 'COMPLETED'")) || [];

    // Computations
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

    // Build CSV Content
    let csv = 'Metric,Value\n';
    csv += `Total Fleet Size,${totalVehicles}\n`;
    csv += `Active Vehicles,${activeVehicles}\n`;
    csv += `Fleet Utilization (%),${utilization}\n`;
    csv += `Total Distance (km),${totalDistance}\n`;
    csv += `Total Fuel (Liters),${totalFuelLiters}\n`;
    csv += `Fuel Efficiency (km/L),${fuelEfficiency}\n`;
    csv += `Total Revenue ($),${totalRevenue}\n`;
    csv += `Total Fuel Cost ($),${totalFuelCost}\n`;
    csv += `Total Maintenance Cost ($),${totalMaintenanceCost}\n`;
    csv += `Total Other Expenses ($),${totalOtherExpenses}\n`;
    csv += `Total Operational Cost ($),${operationalCost}\n`;
    csv += `Total Profit / Loss ($),${profit}\n`;
    csv += `Total Fleet Acquisition Cost ($),${totalAcquisitionCost}\n`;
    csv += `Overall Vehicle ROI (%),${vehicleROI}\n`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transitops_reports.csv"'
      }
    });
  } catch (err) {
    console.error('[CSV Export Error]', err);
    return NextResponse.json({ error: 'Failed to generate CSV report.' }, { status: 500 });
  }
}
