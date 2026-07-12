"use client";

import { useState } from 'react';
import { Plus, XCircle, Droplet } from 'lucide-react';

export default function FuelClient({ initialLogs, vehicles, createAction }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">All Fuel Logs</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Log
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Liters</th>
                <th className="px-6 py-3">Price/L</th>
                <th className="px-6 py-3">Total Cost</th>
                <th className="px-6 py-3">Odometer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {initialLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{log.date}</td>
                  <td className="px-6 py-4">{log.registration_number}</td>
                  <td className="px-6 py-4">{log.liters.toFixed(2)} L</td>
                  <td className="px-6 py-4">${log.price_per_liter.toFixed(2)}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">${log.total_cost.toFixed(2)}</td>
                  <td className="px-6 py-4">{log.odometer || '-'}</td>
                </tr>
              ))}
              {initialLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No fuel logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-800">Add Fuel Log</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
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
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                <select name="vehicleId" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Liters</label>
                  <input type="number" step="0.01" name="liters" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price/L</label>
                  <input type="number" step="0.01" name="pricePerLiter" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Odometer</label>
                <input type="number" step="0.01" name="odometer" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Current km (optional)" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
