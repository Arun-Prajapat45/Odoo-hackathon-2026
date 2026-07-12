import { queryDb } from '@/lib/db';
import ExpenseClient from './ExpenseClient';
import { createExpense } from './actions';

export default async function ExpensePage() {
  const expenseRes = await queryDb(`
    SELECT e.*, v.registration_number 
    FROM expense e 
    LEFT JOIN vehicle v ON e.vehicle_id = v.id 
    ORDER BY e.date DESC, e.id DESC
  `);
  
  const vehiclesRes = await queryDb("SELECT id, registration_number FROM vehicle");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Expense Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Track tolls, permits, and other operational expenses</p>
      </div>
      
      <ExpenseClient 
        initialLogs={expenseRes || []} 
        vehicles={vehiclesRes || []} 
        createAction={createExpense}
      />
    </div>
  );
}
