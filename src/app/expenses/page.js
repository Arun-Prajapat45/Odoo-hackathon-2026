import React from 'react';
import { queryDb, safeQuery } from '@/lib/db';
import ExpenseClient from './ExpenseClient';
import { createExpense } from './actions';
import { Receipt } from 'lucide-react';

export default async function ExpensePage() {
  const [expenseRes, vehiclesRes] = await Promise.all([
    safeQuery(`
      SELECT e.*, v.registration_number, v.vehicle_name 
      FROM expense e 
      LEFT JOIN vehicle v ON e.vehicle_id = v.id 
      ORDER BY e.date DESC, e.id DESC
    `, [], []),
    safeQuery("SELECT id, registration_number, vehicle_name FROM vehicle", [], [])
  ]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Fleet Operational Expense Audit</span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                {(expenseRes || []).length} Records
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Log highway tolls, regional permits, driver advances, miscellaneous transit costs, and audit fleet finances.
            </p>
          </div>
        </div>
      </div>
      
      <ExpenseClient 
        initialLogs={expenseRes || []} 
        vehicles={vehiclesRes || []} 
        createAction={createExpense}
      />
    </div>
  );
}
