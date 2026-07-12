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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Expense Logs</h1>
      </div>
      
      <ExpenseClient 
        initialLogs={expenseRes || []} 
        vehicles={vehiclesRes || []} 
        createAction={createExpense}
      />
    </div>
  );
}
