import React from 'react';
import { queryDb, safeQuery } from '@/lib/db';
import FuelClient from '../fuel/FuelClient';
import ExpenseClient from '../expenses/ExpenseClient';
import { createFuelLog } from '../fuel/actions';
import { createExpense } from '../expenses/actions';
import { Banknote } from 'lucide-react';

export default async function FuelExpensesPage() {
  const [fuelRes, expenseRes, vehiclesRes, maintRes] = await Promise.all([
    safeQuery(`
      SELECT f.*, v.registration_number, v.vehicle_name 
      FROM fuel_log f 
      LEFT JOIN vehicle v ON f.vehicle_id = v.id 
      ORDER BY f.date DESC, f.id DESC
    `, [], []),
    safeQuery(`
      SELECT e.*, v.registration_number, v.vehicle_name 
      FROM expense e 
      LEFT JOIN vehicle v ON e.vehicle_id = v.id 
      ORDER BY e.date DESC, e.id DESC
    `, [], []),
    safeQuery("SELECT id, registration_number, vehicle_name, fuel_type FROM vehicle", [], []),
    safeQuery('SELECT cost FROM maintenance', [], [])
  ]);

  const fuelLogs = fuelRes || [];
  const expenses = expenseRes || [];
  const vehicles = vehiclesRes || [];
  const maintenances = maintRes || [];

  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.total_cost || 0), 0);
  const totalMaintCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalOtherExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalOperationalCost = totalFuelCost + totalMaintCost + totalOtherExpenses;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
            <Banknote size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Fuel & Expense Management</span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
                Financial Tracking
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Log refueling receipts, monitor fleet mileage, toll expenses, and total operational costs.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Fuel Logs</h2>
          <FuelClient 
            initialLogs={fuelLogs} 
            vehicles={vehicles} 
            createAction={createFuelLog}
          />
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Other Expenses (Toll / Misc)</h2>
          <ExpenseClient 
            initialLogs={expenses} 
            vehicles={vehicles} 
            createAction={createExpense}
          />
        </div>
      </div>

      {/* Footer Total */}
      <div className="glass-card p-5 mt-6 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Total Operational Cost (Auto) = Fuel + Maint + Other
          </span>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-500">
            ₹{totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
