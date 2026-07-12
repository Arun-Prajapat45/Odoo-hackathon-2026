'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Trash2, X, Truck } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  const [formData, setFormData] = useState({
    registrationNumber: '', vehicleName: '', categoryId: '',
    manufacturer: '', model: '', year: '', capacity: '',
    odometer: '', fuelType: 'DIESEL', purchaseCost: '',
    status: 'AVAILABLE', currentLocation: '', insuranceExpiry: '', pollutionExpiry: ''
  });

  const fetchVehicles = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (typeFilter) query.append('type', typeFilter);

    fetch(`/api/vehicles?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => { setVehicles(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter, typeFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.registrationNumber || !formData.vehicleName || !formData.categoryId || !formData.capacity || !formData.fuelType) {
      setFormError('Please fill out all required fields (*)');
      return;
    }
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add vehicle');

      fetchVehicles();
      setIsAddModalOpen(false);
      setFormData({
        registrationNumber: '', vehicleName: '', categoryId: '', manufacturer: '',
        model: '', year: '', capacity: '', odometer: '', fuelType: 'DIESEL',
        purchaseCost: '', status: 'AVAILABLE', currentLocation: '', insuranceExpiry: '', pollutionExpiry: ''
      });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteVehicle = async (id) => {
    setDeleteError('');
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete vehicle');
      fetchVehicles();
    } catch (err) {
      setDeleteError(err.message);
      setTimeout(() => setDeleteError(''), 5000);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      ON_TRIP: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      IN_SHOP: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      RETIRED: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    };
    const labels = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', IN_SHOP: 'In Shop', RETIRED: 'Retired' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.RETIRED}`}>{labels[status] || status}</span>;
  };

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicle Registry</h1>
          <p className="text-slate-400 text-sm mt-1">Register and manage fleet vehicles, load limits, and document compliance.</p>
        </div>
        <button 
          onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
        >
          <Plus size={16} /> Register Vehicle
        </button>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <span className="font-semibold">Deletion Blocked:</span> {deleteError}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-slate-900 rounded-xl border border-slate-800/60 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-3 flex-wrap flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Odometer</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    Loading vehicles...
                  </div>
                </td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                  <Truck size={32} className="mx-auto mb-2 text-slate-600" />
                  No vehicles found matching the filters.
                </td></tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{vehicle.vehicleName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {vehicle.manufacturer || 'N/A'} {vehicle.model || ''} {vehicle.year ? `(${vehicle.year})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{vehicle.registrationNumber}</td>
                    <td className="px-6 py-4 text-slate-300">{vehicle.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-white font-medium">{vehicle.capacity?.toLocaleString()} kg</td>
                    <td className="px-6 py-4 text-slate-400">{vehicle.odometer?.toLocaleString()} km</td>
                    <td className="px-6 py-4">{getStatusBadge(vehicle.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/vehicles/${vehicle.id}`} className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="View">
                          <Eye size={16} />
                        </Link>
                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-white">Register New Vehicle</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="vehicleForm" onSubmit={handleAddVehicle}>
                {formError && <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">⚠ {formError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div><label className={labelClass}>Registration Number *</label><input type="text" name="registrationNumber" placeholder="e.g. MH-12-HE-1234" value={formData.registrationNumber} onChange={handleInputChange} className={inputClass} required /></div>
                  <div><label className={labelClass}>Vehicle Name *</label><input type="text" name="vehicleName" placeholder="e.g. Eicher Pro" value={formData.vehicleName} onChange={handleInputChange} className={inputClass} required /></div>
                  <div><label className={labelClass}>Category *</label><select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className={inputClass} required><option value="">Select Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className={labelClass}>Fuel Type *</label><select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className={inputClass} required><option value="DIESEL">Diesel</option><option value="PETROL">Petrol</option><option value="CNG">CNG</option><option value="EV">Electric (EV)</option></select></div>
                  <div><label className={labelClass}>Manufacturer</label><input type="text" name="manufacturer" placeholder="e.g. Eicher" value={formData.manufacturer} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Model</label><input type="text" name="model" placeholder="e.g. Pro 2049" value={formData.model} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Year</label><input type="number" name="year" placeholder="e.g. 2023" value={formData.year} onChange={handleInputChange} className={inputClass} min="1900" max={new Date().getFullYear() + 1} /></div>
                  <div><label className={labelClass}>Max Load Capacity (kg) *</label><input type="number" name="capacity" placeholder="e.g. 3500" value={formData.capacity} onChange={handleInputChange} className={inputClass} required min="1" /></div>
                  <div><label className={labelClass}>Initial Odometer (km)</label><input type="number" name="odometer" placeholder="e.g. 15000" value={formData.odometer} onChange={handleInputChange} className={inputClass} min="0" /></div>
                  <div><label className={labelClass}>Purchase Cost (INR)</label><input type="number" name="purchaseCost" placeholder="e.g. 1200000" value={formData.purchaseCost} onChange={handleInputChange} className={inputClass} min="0" /></div>
                  <div><label className={labelClass}>Initial Status</label><select name="status" value={formData.status} onChange={handleInputChange} className={inputClass}><option value="AVAILABLE">Available</option><option value="IN_SHOP">In Shop</option><option value="RETIRED">Retired</option></select></div>
                  <div><label className={labelClass}>Current Location</label><input type="text" name="currentLocation" placeholder="e.g. Depot-A" value={formData.currentLocation} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Insurance Expiry</label><input type="date" name="insuranceExpiry" value={formData.insuranceExpiry} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Pollution Expiry</label><input type="date" name="pollutionExpiry" value={formData.pollutionExpiry} onChange={handleInputChange} className={inputClass} /></div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="vehicleForm" className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all shadow-lg shadow-blue-500/20">
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
