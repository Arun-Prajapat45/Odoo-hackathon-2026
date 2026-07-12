'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Trash2, X, Truck, Filter, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

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
      .then((data) => {
        if (Array.isArray(data)) setVehicles(data);
        else if (data.data && Array.isArray(data.data)) setVehicles(data.data);
        else setVehicles([]);
        setLoading(false);
      })
      .catch((err) => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
        else if (data.data && Array.isArray(data.data)) setCategories(data.data);
      })
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
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add vehicle');

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
    if (!confirm('Are you sure you want to delete this vehicle from the registry?')) return;
    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || (data && data.success === false)) throw new Error(data.error || 'Failed to delete vehicle');
      fetchVehicles();
    } catch (err) {
      setDeleteError(err.message);
      setTimeout(() => setDeleteError(''), 5000);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
      ON_TRIP: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
      IN_SHOP: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
      RETIRED: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    };
    const labels = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', IN_SHOP: 'In Shop', RETIRED: 'Retired' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${styles[status] || styles.RETIRED}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'AVAILABLE' ? 'bg-emerald-500' : status === 'ON_TRIP' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
        <span>{labels[status] || status}</span>
      </span>
    );
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="saas-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Vehicle & Fleet Registry</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                {vehicles.length} Units Registered
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Register fleet units, track load limits, monitor fuel efficiency, and verify document compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Plus size={16} />
            <span>Register Vehicle</span>
          </button>
          <button
            onClick={fetchVehicles}
            disabled={loading}
            className="btn-secondary p-2"
            title="Refresh registry"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span><strong className="font-bold">Deletion Blocked:</strong> {deleteError}</span>
        </div>
      )}

      {/* Filter Tabs by Category */}
      <div className="saas-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === ''
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Categories ({vehicles.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setTypeFilter(cat.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  typeFilter === cat.name
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all uppercase ${
                  statusFilter === st
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st === '' ? 'All Status' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by registration number, vehicle name, manufacturer, or fuel type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Vehicles Table / Grid */}
      {loading ? (
        <div className="saas-card p-12 text-center text-slate-400 dark:text-slate-500">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-sm font-semibold">Loading vehicle registry...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="saas-card p-16 text-center text-slate-400 dark:text-slate-500 max-w-md mx-auto">
          <Truck size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No registered vehicles found</h3>
          <p className="text-xs mt-1 text-slate-500">
            {search || statusFilter || typeFilter
              ? 'Try clearing or modifying your filters and search criteria.'
              : 'Click "Register Vehicle" above to add your first fleet unit to TransitOps.'}
          </p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 md:px-6">Vehicle Unit</th>
                  <th className="py-3 px-4">Category & Model</th>
                  <th className="py-3 px-4">Capacity / Odometer</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Fuel Type</th>
                  <th className="py-3 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 md:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200/60 dark:border-blue-500/20">
                          <Truck size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-none flex items-center gap-2">
                            <span>{v.registration_number || v.registrationNumber}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {v.vehicle_name || v.vehicleName}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {v.category_name || categories.find(c => c.id === (v.category_id || v.categoryId))?.name || 'Standard Unit'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {v.manufacturer || 'Generic'} • {v.model || 'Model'} ({v.year || 'N/A'})
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {v.capacity ? `${v.capacity} Tons` : '—'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {v.odometer ? `${Number(v.odometer).toLocaleString()} km` : '0 km'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(v.status)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {v.fuel_type || v.fuelType || 'DIESEL'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 md:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:border-blue-500/60"
                        >
                          <Eye size={14} className="text-blue-500" />
                          <span className="hidden sm:inline">Details</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete vehicle unit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Register New Fleet Unit</h3>
                  <p className="text-xs text-slate-500">Enter vehicle specifications and regulatory documents</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="p-6 overflow-y-auto space-y-5">
              {formError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., KA-01-EQ-9921"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Vehicle Alias / Name *</label>
                  <input
                    type="text"
                    name="vehicleName"
                    required
                    value={formData.vehicleName}
                    onChange={handleInputChange}
                    placeholder="e.g., FreightLiner Express #4"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Category *</label>
                  <select
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Fuel Type *</label>
                  <select
                    name="fuelType"
                    required
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="ELECTRIC">Electric</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Payload Capacity (Tons) *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="capacity"
                    required
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 18.5"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Initial Odometer (km)</label>
                  <input
                    type="number"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleInputChange}
                    placeholder="e.g., 42000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g., Tata or Volvo"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Model & Year</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      placeholder="Model"
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      placeholder="Year"
                      className={`${inputClass} w-24`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Insurance Expiry Date</label>
                  <input
                    type="date"
                    name="insuranceExpiry"
                    value={formData.insuranceExpiry}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Pollution Certificate Expiry</label>
                  <input
                    type="date"
                    name="pollutionExpiry"
                    value={formData.pollutionExpiry}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs"
                >
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
