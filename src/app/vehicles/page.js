'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Trash2 } from 'lucide-react';

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
    switch (status) {
      case 'AVAILABLE': return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Available</span>;
      case 'ON_TRIP': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">On Trip</span>;
      case 'IN_SHOP': return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">In Shop</span>;
      case 'RETIRED': return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">Retired</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vehicle Registry</h1>
          <p className="text-slate-500 text-sm mt-1">Register and manage fleet vehicles, load limits, and document compliance.</p>
        </div>
        <button 
          onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Register Vehicle
        </button>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <strong>Deletion Blocked:</strong> {deleteError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4 bg-slate-50/50">
          <div className="flex gap-4 flex-wrap flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by registration, name, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[150px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Vehicle Details</th>
                <th className="px-6 py-3">Registration</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Capacity (Max Load)</th>
                <th className="px-6 py-3">Odometer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Loading registry...</td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No vehicles found matching the filters.</td></tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{vehicle.vehicleName}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {vehicle.manufacturer || 'N/A'} {vehicle.model || 'N/A'} {vehicle.year ? `(${vehicle.year})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{vehicle.registrationNumber}</td>
                    <td className="px-6 py-4">{vehicle.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium">{vehicle.capacity?.toLocaleString()} kg</td>
                    <td className="px-6 py-4 text-slate-500">{vehicle.odometer?.toLocaleString()} km</td>
                    <td className="px-6 py-4">{getStatusBadge(vehicle.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link href={`/vehicles/${vehicle.id}`} className="text-slate-400 hover:text-blue-600 flex items-center gap-1" title="View">
                          <Eye size={16} />
                        </Link>
                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="text-slate-400 hover:text-red-600 flex items-center gap-1" title="Delete">
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

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-800">Register New Vehicle</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="vehicleForm" onSubmit={handleAddVehicle}>
                {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">⚠ {formError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number *</label>
                    <input type="text" name="registrationNumber" placeholder="e.g. MH-12-HE-1234" value={formData.registrationNumber} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Name *</label>
                    <input type="text" name="vehicleName" placeholder="e.g. Eicher Pro" value={formData.vehicleName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required>
                      <option value="">Select Category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type *</label>
                    <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required>
                      <option value="DIESEL">Diesel</option>
                      <option value="PETROL">Petrol</option>
                      <option value="CNG">CNG</option>
                      <option value="EV">Electric (EV)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                    <input type="text" name="manufacturer" placeholder="e.g. Eicher" value={formData.manufacturer} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                    <input type="text" name="model" placeholder="e.g. Pro 2049" value={formData.model} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                    <input type="number" name="year" placeholder="e.g. 2023" value={formData.year} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" min="1900" max={new Date().getFullYear() + 1} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Load Capacity (kg) *</label>
                    <input type="number" name="capacity" placeholder="e.g. 3500" value={formData.capacity} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Odometer (km)</label>
                    <input type="number" name="odometer" placeholder="e.g. 15000" value={formData.odometer} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Cost (INR)</label>
                    <input type="number" name="purchaseCost" placeholder="e.g. 1200000" value={formData.purchaseCost} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_SHOP">In Shop</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
                    <input type="text" name="currentLocation" placeholder="e.g. Depot-A" value={formData.currentLocation} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Expiry Date</label>
                    <input type="date" name="insuranceExpiry" value={formData.insuranceExpiry} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pollution Expiry Date</label>
                    <input type="date" name="pollutionExpiry" value={formData.pollutionExpiry} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="vehicleForm" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
