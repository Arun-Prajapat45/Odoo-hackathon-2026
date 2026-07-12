"use client";

import { useState } from 'react';
import { Plus, X, Receipt } from 'lucide-react';

export default function ExpenseClient({ initialLogs, vehicles, createAction }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <>
      <div className="bg-slate-900 rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center">
          <h2 className="font-semibold text-white">All Expenses</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {initialLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-slate-300">{log.date}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">{log.registration_number}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-500/15 text-indigo-400 border-indigo-500/20">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">${log.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-500">{log.remarks || '-'}</td>
                </tr>
              ))}
              {initialLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Receipt size={32} className="mx-auto mb-2 text-slate-600" />
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-white">Add Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form action={async (formData) => {
              try {
                await createAction(formData);
                setIsModalOpen(false);
              } catch (err) {
                setError(err.message);
              }
            }} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">{error}</div>}
              
              <div><label className={labelClass}>Date</label><input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} /></div>
              <div><label className={labelClass}>Vehicle</label><select name="vehicleId" required className={inputClass}><option value="">Select a vehicle...</option>{vehicles.map(v => (<option key={v.id} value={v.id}>{v.registration_number}</option>))}</select></div>
              <div><label className={labelClass}>Type</label><select name="type" required className={inputClass}><option value="TOLL">Toll</option><option value="MAINTENANCE">Maintenance</option><option value="FUEL">Fuel (Non-Log)</option><option value="MISC">Miscellaneous</option></select></div>
              <div><label className={labelClass}>Amount ($)</label><input type="number" step="0.01" name="amount" required className={inputClass} placeholder="0.00" /></div>
              <div><label className={labelClass}>Remarks</label><textarea name="remarks" rows="2" className={inputClass} placeholder="Any details..."></textarea></div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all shadow-lg shadow-blue-500/20">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
