'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit2, Trash2, ShieldCheck, ShieldAlert, Download, X, AlertTriangle, Plus, MapPin } from 'lucide-react';

export default function VehicleDetailsPage({ params: paramsPromise }) {
  const router = useRouter();
  
  // Resolve params using React.use() to comply with Next.js 15+ async params standard
  const params = use(paramsPromise);
  const vehicleId = params.id;

  const [vehicle, setVehicle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState('');

  // Document Upload Form State
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('Insurance');
  const [docExpiry, setDocExpiry] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Fetch Vehicle and Category Data
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Vehicle not found');
        throw new Error('Failed to load vehicle details');
      }
      const data = await res.json();
      setVehicle(data);
      
      // Seed edit form default values
      setEditFormData({
        registrationNumber: data.registrationNumber,
        vehicleName: data.vehicleName,
        categoryId: String(data.categoryId),
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        year: data.year ? String(data.year) : '',
        capacity: String(data.capacity),
        odometer: String(data.odometer),
        fuelType: data.fuelType,
        purchaseCost: String(data.purchaseCost),
        status: data.status,
        currentLocation: data.currentLocation || '',
        insuranceExpiry: data.insuranceExpiry || '',
        pollutionExpiry: data.pollutionExpiry || ''
      });

      // Fetch Categories
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      setCategories(catData);
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vehicleId]);

  // Update Status Quick Switcher
  const handleStatusChange = async (status) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      
      setVehicle(prev => ({ ...prev, status }));
      setEditFormData(prev => ({ ...prev, status }));
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Edit Form Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editFormData.registrationNumber || !editFormData.vehicleName || !editFormData.categoryId || !editFormData.capacity || !editFormData.fuelType) {
      setEditError('Please fill out all required fields (*)');
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          categoryId: parseInt(editFormData.categoryId, 10),
          year: editFormData.year ? parseInt(editFormData.year, 10) : null,
          capacity: parseFloat(editFormData.capacity),
          odometer: parseFloat(editFormData.odometer),
          purchaseCost: parseFloat(editFormData.purchaseCost)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vehicle');

      setVehicle(data);
      setIsEditModalOpen(false);
      fetchData(); // Reload details
    } catch (err) {
      setEditError(err.message);
    }
  };

  // Upload Document Handler
  const handleDocUpload = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!docFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append('file', docFile);
    formDataObj.append('documentType', docType);
    formDataObj.append('expiryDate', docExpiry);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: 'POST',
        body: formDataObj // Fetch will automatically set content-type multipart/form-data
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document');

      // Refresh documents
      setVehicle(prev => ({
        ...prev,
        documents: [...prev.documents, data]
      }));

      // Reset file input form
      setDocFile(null);
      setDocExpiry('');
      // Reset input element
      const fileInput = document.getElementById('document-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete Document Handler
  const handleDocDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/vehicles/documents/${docId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete document');

      // Remove from state
      setVehicle(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== docId)
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle Document Verification Status
  const handleToggleDocVerification = async (docId, currentVerified) => {
    try {
      const res = await fetch(`/api/vehicles/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentVerified })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update document verification status');

      // Update state
      setVehicle(prev => ({
        ...prev,
        documents: prev.documents.map(d => d.id === docId ? { ...d, verified: data.verified } : d)
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Vehicle Handler
  const handleDeleteVehicle = async () => {
    if (!confirm('Are you sure you want to delete this vehicle permanently?')) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete vehicle');

      // Direct to main page
      router.push('/vehicles');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-64 bg-slate-900 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          Loading vehicle records...
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800/60 rounded-xl">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Page</h2>
        <p className="text-slate-400 mb-6">{error || 'Vehicle not found.'}</p>
        <Link href="/vehicles" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700">
          <ChevronLeft size={16} /> Back to Registry
        </Link>
      </div>
    );
  }

  // Check if active trip exists
  const activeTrips = vehicle.trips?.filter(t => ['DRAFT', 'DISPATCHED'].includes(t.status)) || [];
  const hasActiveTrip = activeTrips.length > 0;

  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      ON_TRIP: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      IN_SHOP: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      RETIRED: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    };
    const labels = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', IN_SHOP: 'In Shop', RETIRED: 'Retired' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>{labels[status] || status}</span>;
  };

  const getTripStatusStyle = (status) => {
    const map = {
      DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
      DISPATCHED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
      COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
    };
    return map[status] || map.DRAFT;
  };

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link href="/vehicles" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Vehicles
        </Link>
      </div>

      {/* Main Details Panel */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {vehicle.vehicleName}
            {getStatusBadge(vehicle.status)}
          </h1>
          <p className="text-slate-400 mt-1 font-mono font-medium">
            REG: {vehicle.registrationNumber}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            <Edit2 size={16} /> Edit Details
          </button>
          <button 
            onClick={handleDeleteVehicle} 
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={hasActiveTrip}
            title={hasActiveTrip ? "Cannot delete vehicle with active trips" : "Delete vehicle"}
          >
            <Trash2 size={16} /> Delete Vehicle
          </button>
        </div>
      </div>

      {/* Active Trip Blocking Notice */}
      {hasActiveTrip && (
        <div className="p-4 rounded-xl flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>This vehicle is locked and cannot be deleted because it is assigned to an active trip ({activeTrips[0].trip_number || activeTrips[0].tripNumber || activeTrips[0].id} - {activeTrips[0].status}).</span>
        </div>
      )}

      {/* Details Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-6 shadow-md backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Vehicle Telemetry & Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Category</span>
                <span className="text-sm font-medium text-white">{vehicle.category?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Load Capacity</span>
                <span className="text-sm font-medium text-white">{vehicle.capacity?.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Odometer Reading</span>
                <span className="text-sm font-medium text-white">{vehicle.odometer?.toLocaleString()} km</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Fuel Type</span>
                <span className="text-sm font-medium text-white">{vehicle.fuelType}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Manufacturer</span>
                <span className="text-sm font-medium text-white">{vehicle.manufacturer || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Model</span>
                <span className="text-sm font-medium text-white">{vehicle.model || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Year</span>
                <span className="text-sm font-medium text-white">{vehicle.year || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Acquisition Cost</span>
                <span className="text-sm font-medium text-white">{vehicle.purchaseCost ? `₹${vehicle.purchaseCost.toLocaleString()}` : 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Current Location</span>
                <span className="text-sm font-medium text-white">{vehicle.currentLocation || 'Depot'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Insurance Expiry</span>
                <span className={`text-sm font-medium ${vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? 'text-red-400 font-bold' : 'text-white'}`}>
                  {vehicle.insuranceExpiry || 'N/A'} {vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? '(Expired)' : ''}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Pollution Expiry</span>
                <span className={`text-sm font-medium ${vehicle.pollutionExpiry && new Date(vehicle.pollutionExpiry) < new Date() ? 'text-red-400 font-bold' : 'text-white'}`}>
                  {vehicle.pollutionExpiry || 'N/A'} {vehicle.pollutionExpiry && new Date(vehicle.pollutionExpiry) < new Date() ? '(Expired)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status Control Switcher */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-6 shadow-md backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Set Vehicle Status (Manual override)</h2>
            <div className="flex flex-wrap gap-3">
              {['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'].map((st) => {
                const isActive = vehicle.status === st;
                let activeClass = '';
                if (isActive) {
                  switch(st) {
                    case 'AVAILABLE': activeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'; break;
                    case 'ON_TRIP': activeClass = 'bg-blue-500/20 text-blue-400 border-blue-500/30'; break;
                    case 'IN_SHOP': activeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30'; break;
                    case 'RETIRED': activeClass = 'bg-red-500/20 text-red-400 border-red-500/30'; break;
                  }
                } else {
                  activeClass = 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white';
                }
                
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeClass}`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trip History Log */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-0 overflow-hidden shadow-md backdrop-blur-sm">
            <div className="p-4 border-b border-slate-700/60">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Assigned Trip Telemetry History</h2>
            </div>
            {(!vehicle.trips || vehicle.trips.length === 0) ? (
              <p className="p-8 text-sm text-slate-400 text-center">No trips registered for this vehicle.</p>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {vehicle.trips.map((trip) => (
                  <div key={trip.id} className="p-4 hover:bg-slate-700/30 transition-colors flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-bold text-white">{trip.trip_number || trip.tripNumber || `TRIP-${trip.id}`}</span>
                        <span className="text-sm text-slate-300 flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> {trip.source} → {trip.destination}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Cargo Weight: {trip.cargo_weight || trip.cargoWeight || 0} kg
                      </span>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getTripStatusStyle(trip.status)}`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side compliance documents */}
        <div className="space-y-6">
          {/* Document upload card */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-6 shadow-md backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Compliance Documents</h2>
            
            {/* List of uploaded documents */}
            {(!vehicle.documents || vehicle.documents.length === 0) ? (
              <p className="text-sm text-slate-400 mb-6 pb-6 border-b border-slate-700/60">No compliance documents registered.</p>
            ) : (
              <div className="space-y-3 mb-6 pb-6 border-b border-slate-700/60">
                {vehicle.documents.map((doc) => (
                  <div key={doc.id} className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg flex flex-col gap-2 transition-colors hover:bg-slate-800">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-white">{doc.document_type || doc.documentType}</span>
                      <div className="flex gap-2">
                        <a 
                          href={doc.document_url || doc.documentUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-blue-400 transition-colors p-1"
                          title="View / Download Document"
                        >
                          <Download size={16} />
                        </a>
                        <button 
                          onClick={() => handleDocDelete(doc.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1"
                          title="Delete Document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">
                        Expires: {doc.expiry_date || doc.expiryDate || 'No expiry'}
                      </span>
                      
                      {doc.verified || doc.is_verified ? (
                        <button 
                          onClick={() => handleToggleDocVerification(doc.id, true)}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors" 
                          title="Toggle to Unverify"
                        >
                          <ShieldCheck size={14} /> Verified
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleDocVerification(doc.id, false)}
                          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors" 
                          title="Click to verify document"
                        >
                          <ShieldAlert size={14} /> Unverified
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Document upload form */}
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Plus size={16} className="text-blue-400" /> Upload Document
            </h3>
            <form onSubmit={handleDocUpload} className="space-y-4">
              {uploadError && (
                <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">
                  {uploadError}
                </div>
              )}

              <div>
                <label className={labelClass}>Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className={inputClass}
                >
                  <option value="Insurance">Insurance Policy</option>
                  <option value="RC">Registration Certificate (RC)</option>
                  <option value="Pollution">Pollution Certificate (PUC)</option>
                  <option value="Permit">Road Permit</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Expiration Date</label>
                <input 
                  type="date" 
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Upload File (PDF / Image)</label>
                <input 
                  type="file" 
                  id="document-file-input"
                  onChange={(e) => setDocFile(e.target.files[0])}
                  className={`${inputClass} !py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20`}
                  accept=".pdf,image/*"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <h3 className="font-semibold text-lg text-white">Edit Vehicle Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} autoComplete="off">
              <div className="p-6">
                {editError && (
                  <div className="mb-6 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Registration Number *</label>
                    <input type="text" value={editFormData.registrationNumber} onChange={(e) => setEditFormData(prev => ({ ...prev, registrationNumber: e.target.value }))} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Vehicle Display Name *</label>
                    <input type="text" value={editFormData.vehicleName} onChange={(e) => setEditFormData(prev => ({ ...prev, vehicleName: e.target.value }))} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Category *</label>
                    <select value={editFormData.categoryId} onChange={(e) => setEditFormData(prev => ({ ...prev, categoryId: e.target.value }))} className={inputClass} required>
                      <option value="">Select Category</option>
                      {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Fuel Type *</label>
                    <select value={editFormData.fuelType} onChange={(e) => setEditFormData(prev => ({ ...prev, fuelType: e.target.value }))} className={inputClass} required>
                      <option value="DIESEL">Diesel</option>
                      <option value="PETROL">Petrol</option>
                      <option value="CNG">CNG</option>
                      <option value="EV">Electric (EV)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Manufacturer</label>
                    <input type="text" value={editFormData.manufacturer} onChange={(e) => setEditFormData(prev => ({ ...prev, manufacturer: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Model</label>
                    <input type="text" value={editFormData.model} onChange={(e) => setEditFormData(prev => ({ ...prev, model: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Year</label>
                    <input type="number" value={editFormData.year} onChange={(e) => setEditFormData(prev => ({ ...prev, year: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Load Capacity (kg) *</label>
                    <input type="number" value={editFormData.capacity} onChange={(e) => setEditFormData(prev => ({ ...prev, capacity: e.target.value }))} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Odometer Reading (km)</label>
                    <input type="number" value={editFormData.odometer} onChange={(e) => setEditFormData(prev => ({ ...prev, odometer: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Purchase Cost (INR)</label>
                    <input type="number" value={editFormData.purchaseCost} onChange={(e) => setEditFormData(prev => ({ ...prev, purchaseCost: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Current Location</label>
                    <input type="text" value={editFormData.currentLocation} onChange={(e) => setEditFormData(prev => ({ ...prev, currentLocation: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select value={editFormData.status} onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))} className={inputClass}>
                      <option value="AVAILABLE">Available</option>
                      <option value="ON_TRIP">On Trip</option>
                      <option value="IN_SHOP">In Shop</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Insurance Expiry Date</label>
                    <input type="date" value={editFormData.insuranceExpiry} onChange={(e) => setEditFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Pollution Expiry Date</label>
                    <input type="date" value={editFormData.pollutionExpiry} onChange={(e) => setEditFormData(prev => ({ ...prev, pollutionExpiry: e.target.value }))} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-slate-900">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all shadow-lg shadow-blue-500/20">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
