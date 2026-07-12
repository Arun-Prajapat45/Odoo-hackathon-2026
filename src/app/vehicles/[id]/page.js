'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Download,
  X,
  AlertTriangle,
  Plus,
  MapPin,
  Truck,
  FileText,
  Calendar,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export default function VehicleDetailsPage({ params: paramsPromise }) {
  const router = useRouter();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Vehicle not found in registry');
        throw new Error('Failed to load vehicle details');
      }
      const data = await res.json();
      setVehicle(data);

      setEditFormData({
        registrationNumber: data.registrationNumber || data.registration_number || '',
        vehicleName: data.vehicleName || data.vehicle_name || '',
        categoryId: String(data.categoryId || data.category_id || ''),
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        year: data.year ? String(data.year) : '',
        capacity: String(data.capacity || ''),
        odometer: String(data.odometer || ''),
        fuelType: data.fuelType || data.fuel_type || 'DIESEL',
        purchaseCost: String(data.purchaseCost || data.purchase_cost || ''),
        status: data.status || 'AVAILABLE',
        currentLocation: data.currentLocation || data.current_location || '',
        insuranceExpiry: data.insuranceExpiry || data.insurance_expiry || '',
        pollutionExpiry: data.pollutionExpiry || data.pollution_expiry || ''
      });

      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (Array.isArray(catData)) setCategories(catData);
      else if (catData.data && Array.isArray(catData.data)) setCategories(catData.data);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vehicleId]);

  const handleStatusChange = async (status) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vehicle operational status');

      setVehicle(prev => ({ ...prev, status }));
      setEditFormData(prev => ({ ...prev, status }));
    } catch (err) {
      alert(err.message);
    }
  };

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
      if (!res.ok) throw new Error(data.error || 'Failed to update vehicle specifications');

      setVehicle(data);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!docFile) {
      setUploadError('Please select a valid PDF or image file to upload.');
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
        body: formDataObj
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload compliance document');

      await fetchData();
      setDocFile(null);
      setDocExpiry('');
      const fileInput = document.getElementById('document-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDocDelete = async (docId) => {
    if (!confirm('Permanently delete this compliance document?')) return;
    try {
      const res = await fetch(`/api/vehicles/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete compliance document');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleDocVerification = async (docId, currentVerified) => {
    try {
      const res = await fetch(`/api/vehicles/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentVerified })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update document verification status');

      setVehicle(prev => ({
        ...prev,
        documents: (prev.documents || []).map(d => d.id === docId ? { ...d, verified: data.verified } : d)
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!confirm('Are you sure you want to delete this vehicle permanently from the fleet registry?')) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || (data && data.success === false)) throw new Error(data.error || 'Failed to delete vehicle');
      router.push('/vehicles');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="saas-card p-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-3 text-blue-500" />
        <p className="text-sm font-semibold">Loading vehicle unit specifications & telemetry...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="saas-card p-12 text-center max-w-lg mx-auto">
        <AlertCircle size={44} className="mx-auto mb-3 text-red-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Error Loading Vehicle Unit</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{error || 'Vehicle record not found.'}</p>
        <Link href="/vehicles" className="btn-secondary px-5 py-2.5 inline-flex items-center gap-2">
          <ChevronLeft size={16} /> Back to Registry
        </Link>
      </div>
    );
  }

  const activeTrips = (vehicle.trips || []).filter(t => ['DRAFT', 'DISPATCHED'].includes(t.status));
  const hasActiveTrip = activeTrips.length > 0;

  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
      ON_TRIP: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
      IN_SHOP: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
      RETIRED: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    };
    const labels = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', IN_SHOP: 'In Shop', RETIRED: 'Retired' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${styles[status] || styles.RETIRED}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'AVAILABLE' ? 'bg-emerald-500' : status === 'ON_TRIP' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
        <span>{labels[status] || status}</span>
      </span>
    );
  };

  const getTripStatusStyle = (status) => {
    const map = {
      DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
      DISPATCHED: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30',
      COMPLETED: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
      CANCELLED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30',
    };
    return map[status] || map.DRAFT;
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* Back Link Header */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ChevronLeft size={16} />
          <span>Back to Registry Directory</span>
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="saas-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0 mt-1">
            <Truck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                {vehicle.vehicleName || vehicle.vehicle_name}
              </h1>
              {getStatusBadge(vehicle.status)}
            </div>
            <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                REG: {vehicle.registrationNumber || vehicle.registration_number}
              </span>
              <span>•</span>
              <span>{vehicle.category?.name || vehicle.category_name || 'Standard Unit'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Edit2 size={15} className="text-blue-500" />
            <span>Edit Specifications</span>
          </button>
          <button
            onClick={handleDeleteVehicle}
            disabled={hasActiveTrip}
            className="btn-secondary text-xs py-2 px-3.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30 flex items-center gap-1.5 disabled:opacity-50"
            title={hasActiveTrip ? "Cannot delete unit while assigned to active trips" : "Delete unit"}
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete Unit</span>
          </button>
        </div>
      </div>

      {/* Active Trip Blocking Notice */}
      {hasActiveTrip && (
        <div className="p-4 rounded-2xl flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={18} />
          <span>This vehicle is currently locked and cannot be removed because it is assigned to active dispatch trip (<strong className="underline">{activeTrips[0].trip_number || activeTrips[0].tripNumber || activeTrips[0].id}</strong> - {activeTrips[0].status}). Complete or reassign the trip to unlock deletion.</span>
        </div>
      )}

      {/* Details & Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Specifications & Status Control) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Override Card */}
          <div className="saas-card p-6">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-500" />
              <span>Operational Status Manual Override</span>
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'].map((st) => {
                const isActive = vehicle.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? st === 'AVAILABLE' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' :
                          st === 'ON_TRIP' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' :
                          st === 'IN_SHOP' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' :
                          'bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telemetry & Specifications Card */}
          <div className="saas-card p-6">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5">
              Technical Specifications & Telemetry
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Category</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{vehicle.category?.name || vehicle.category_name || 'Standard'}</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Load Capacity</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{Number(vehicle.capacity || 0).toLocaleString()} Tons</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Odometer</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{Number(vehicle.odometer || 0).toLocaleString()} km</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Fuel Type</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block uppercase">{vehicle.fuelType || vehicle.fuel_type || 'DIESEL'}</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Manufacturer</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{vehicle.manufacturer || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Model & Year</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{vehicle.model || 'N/A'} ({vehicle.year || 'N/A'})</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Acquisition Cost</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{vehicle.purchaseCost || vehicle.purchase_cost ? `₹${Number(vehicle.purchaseCost || vehicle.purchase_cost).toLocaleString()}` : 'N/A'}</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Current Location</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{vehicle.currentLocation || vehicle.current_location || 'Main Depot'}</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Insurance Expiry</span>
                <span className={`text-sm font-bold mt-0.5 block ${vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                  {vehicle.insuranceExpiry || vehicle.insurance_expiry || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Pollution Expiry</span>
                <span className={`text-sm font-bold mt-0.5 block ${vehicle.pollutionExpiry && new Date(vehicle.pollutionExpiry) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                  {vehicle.pollutionExpiry || vehicle.pollution_expiry || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Trip Telemetry History */}
          <div className="saas-card overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assigned Trip Telemetry History ({vehicle.trips?.length || 0})
              </h2>
            </div>
            {(!vehicle.trips || vehicle.trips.length === 0) ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                No trip records dispatched or completed for this vehicle unit yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {vehicle.trips.map((trip) => (
                  <div key={trip.id} className="p-4 md:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Link href={`/trips/${trip.id}`} className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                          {trip.trip_number || trip.tripNumber || `TRIP-${trip.id}`}
                        </Link>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{trip.source} → {trip.destination}</span>
                        </span>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Cargo Weight: {Number(trip.cargo_weight || trip.cargoWeight || 0).toLocaleString()} Tons
                      </span>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-sm font-bold border uppercase ${getTripStatusStyle(trip.status)}`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Compliance Documents & Verification) */}
        <div className="space-y-6">
          <div className="saas-card p-6 space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3.5 flex items-center justify-between">
                <span>Compliance Documents</span>
                <span className="text-blue-500 font-bold">{vehicle.documents?.length || 0} Files</span>
              </h2>

              {(!vehicle.documents || vehicle.documents.length === 0) ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 text-xs">
                  No compliance documents registered.
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicle.documents.map((doc) => {
                    const isVerified = doc.verified || doc.is_verified;
                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 transition-all hover:border-blue-500/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={16} className="text-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {doc.document_type || doc.documentType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.document_url || doc.documentUrl ? (
                              <a
                                href={doc.document_url || doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Download / View"
                              >
                                <Download size={14} />
                              </a>
                            ) : null}
                            <button
                              onClick={() => handleDocDelete(doc.id)}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                              title="Delete file"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">
                            Expires: <strong className="text-slate-700 dark:text-slate-300">{doc.expiry_date || doc.expiryDate || 'No expiry'}</strong>
                          </span>

                          <button
                            onClick={() => handleToggleDocVerification(doc.id, isVerified)}
                            className={`flex items-center gap-1 font-bold transition-colors ${
                              isVerified
                                ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                            }`}
                            title="Click to toggle verification status"
                          >
                            {isVerified ? (
                              <>
                                <ShieldCheck size={13} />
                                <span>Verified</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert size={13} />
                                <span>Unverified</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-3.5 flex items-center gap-1.5">
                <Plus size={15} className="text-blue-500" />
                <span>Upload New Compliance Document</span>
              </h3>

              <form onSubmit={handleDocUpload} className="space-y-3.5">
                {uploadError && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-500/30">
                    {uploadError}
                  </div>
                )}

                <div>
                  <label className={labelClass}>Document Type</label>
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
                  <label className={labelClass}>Select File (PDF / Image)</label>
                  <input
                    type="file"
                    id="document-file-input"
                    onChange={(e) => setDocFile(e.target.files[0])}
                    className={`${inputClass} !py-1.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-500/10 file:text-blue-600 dark:file:text-blue-400 cursor-pointer`}
                    accept=".pdf,image/*"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary w-full py-2.5 text-xs font-bold justify-center"
                >
                  <span>{uploading ? 'Uploading & Processing...' : 'Upload & Verify File'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Specifications Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 size={18} className="text-blue-500" />
                <span>Edit Vehicle Specifications</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Registration Number *</label>
                  <input type="text" value={editFormData.registrationNumber || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, registrationNumber: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Vehicle Name / Alias *</label>
                  <input type="text" value={editFormData.vehicleName || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, vehicleName: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Category *</label>
                  <select value={editFormData.categoryId || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, categoryId: e.target.value }))} className={inputClass} required>
                    <option value="">Select Category</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Fuel Type *</label>
                  <select value={editFormData.fuelType || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, fuelType: e.target.value }))} className={inputClass} required>
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric (EV)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input type="text" value={editFormData.manufacturer || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, manufacturer: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Model</label>
                  <input type="text" value={editFormData.model || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, model: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Year</label>
                  <input type="number" value={editFormData.year || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, year: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Load Capacity (Tons) *</label>
                  <input type="number" step="0.1" value={editFormData.capacity || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, capacity: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Odometer (km)</label>
                  <input type="number" value={editFormData.odometer || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, odometer: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Purchase Cost (₹)</label>
                  <input type="number" value={editFormData.purchaseCost || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, purchaseCost: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Current Location</label>
                  <input type="text" value={editFormData.currentLocation || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, currentLocation: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={editFormData.status || 'AVAILABLE'} onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))} className={inputClass}>
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="IN_SHOP">In Shop</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Insurance Expiry Date</label>
                  <input type="date" value={editFormData.insuranceExpiry || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pollution Certificate Expiry</label>
                  <input type="date" value={editFormData.pollutionExpiry || ''} onChange={(e) => setEditFormData(prev => ({ ...prev, pollutionExpiry: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary px-4 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 text-xs">
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
