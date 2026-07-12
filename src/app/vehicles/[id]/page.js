'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit2, Trash2, ShieldCheck, ShieldAlert, FileText, Download, Check, X, AlertTriangle, Plus } from 'lucide-react';
import styles from './details.module.css';
import listStyles from '../vehicles.module.css';

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
      <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading vehicle records...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Error Loading Page</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'Vehicle not found.'}</p>
        <Link href="/vehicles" className="button button-secondary">
          <ChevronLeft size={16} /> Back to Registry
        </Link>
      </div>
    );
  }

  // Check if active trip exists
  const activeTrips = vehicle.trips?.filter(t => ['DRAFT', 'DISPATCHED'].includes(t.status)) || [];
  const hasActiveTrip = activeTrips.length > 0;

  return (
    <div className={styles.container}>
      {/* Back Link */}
      <div>
        <Link href="/vehicles" className={styles['back-link']}>
          <ChevronLeft size={16} /> Back to Vehicles
        </Link>
      </div>

      {/* Main Details Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {vehicle.vehicleName}
            <span className={`badge badge-${vehicle.status.toLowerCase()}`}>
              {vehicle.status.replace('_', ' ')}
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'monospace', fontWeight: '500' }}>
            REG: {vehicle.registrationNumber}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setIsEditModalOpen(true)} 
            className="button button-secondary"
          >
            <Edit2 size={14} /> Edit Details
          </button>
          <button 
            onClick={handleDeleteVehicle} 
            className="button button-danger"
            disabled={hasActiveTrip}
            title={hasActiveTrip ? "Cannot delete vehicle with active trips" : "Delete vehicle"}
          >
            <Trash2 size={14} /> Delete Vehicle
          </button>
        </div>
      </div>

      {/* Active Trip Blocking Notice */}
      {hasActiveTrip && (
        <div className={styles['active-warning-banner']}>
          <AlertTriangle size={18} />
          <span>This vehicle is locked and cannot be deleted because it is assigned to an active trip ({activeTrips[0].tripNumber} - {activeTrips[0].status}).</span>
        </div>
      )}

      {/* Details Grid layout */}
      <div className={styles['layout-grid']}>
        {/* Left Side details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metadata Card */}
          <div className="card">
            <h2 className={styles['section-title']}>Vehicle Telemetry & Specifications</h2>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Category</span>
                <span className={styles['info-value']}>{vehicle.category?.name || 'N/A'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Load Capacity</span>
                <span className={styles['info-value']}>{vehicle.capacity?.toLocaleString()} kg</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Odometer Reading</span>
                <span className={styles['info-value']}>{vehicle.odometer?.toLocaleString()} km</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Fuel Type</span>
                <span className={styles['info-value']}>{vehicle.fuelType}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Manufacturer</span>
                <span className={styles['info-value']}>{vehicle.manufacturer || 'N/A'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Model</span>
                <span className={styles['info-value']}>{vehicle.model || 'N/A'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Year</span>
                <span className={styles['info-value']}>{vehicle.year || 'N/A'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Acquisition Cost</span>
                <span className={styles['info-value']}>{vehicle.purchaseCost ? `₹${vehicle.purchaseCost.toLocaleString()}` : 'N/A'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Current Location</span>
                <span className={styles['info-value']}>{vehicle.currentLocation || 'Depot'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Insurance Expiry</span>
                <span className={styles['info-value']} style={{ color: vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? 'var(--danger)' : 'inherit' }}>
                  {vehicle.insuranceExpiry || 'N/A'} {vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? '(Expired)' : ''}
                </span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Pollution Expiry</span>
                <span className={styles['info-value']} style={{ color: vehicle.pollutionExpiry && new Date(vehicle.pollutionExpiry) < new Date() ? 'var(--danger)' : 'inherit' }}>
                  {vehicle.pollutionExpiry || 'N/A'} {vehicle.pollutionExpiry && new Date(vehicle.pollutionExpiry) < new Date() ? '(Expired)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status Control Switcher */}
          <div className="card">
            <h2 className={styles['section-title']}>Set Vehicle Status (Manual override)</h2>
            <div className={styles['status-widget']}>
              {['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`${styles['status-btn']} ${vehicle.status === st ? styles[`status-btn-active-${st}`] : ''}`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Trip History Log */}
          <div className="card">
            <h2 className={styles['section-title']}>Assigned Trip Telemetry History</h2>
            {(!vehicle.trips || vehicle.trips.length === 0) ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No trips registered for this vehicle.</p>
            ) : (
              <div className={styles['trip-list']}>
                {vehicle.trips.map((trip) => (
                  <div key={trip.id} className={styles['trip-card']}>
                    <div className={styles['trip-info']}>
                      <span className={styles['trip-number']}>{trip.tripNumber}</span>
                      <span className={styles['trip-routes']}>
                        {trip.source} → {trip.destination}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Cargo Weight: {trip.cargoWeight} kg
                      </span>
                    </div>
                    <div>
                      <span className={`badge badge-${trip.status === 'DISPATCHED' ? 'on_trip' : trip.status === 'DRAFT' ? 'in_shop' : trip.status === 'COMPLETED' ? 'available' : 'retired'}`}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Document upload card */}
          <div className="card">
            <h2 className={styles['section-title']}>Compliance Documents</h2>
            
            {/* List of uploaded documents */}
            {(!vehicle.documents || vehicle.documents.length === 0) ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No compliance documents registered.</p>
            ) : (
              <div className={styles['doc-list']} style={{ marginBottom: '1.5rem' }}>
                {vehicle.documents.map((doc) => (
                  <div key={doc.id} className={styles['doc-card']}>
                    <div className={styles['doc-header']}>
                      <span className={styles['doc-type']}>{doc.documentType}</span>
                      <div className={styles['doc-actions']}>
                        <a 
                          href={doc.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles['doc-action-icon']}
                          title="View / Download Document"
                        >
                          <Download size={14} />
                        </a>
                        <button 
                          onClick={() => handleDocDelete(doc.id)}
                          className={`${styles['doc-action-icon']} ${styles['doc-action-icon-delete']}`}
                          title="Delete Document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles['doc-meta']}>
                      <span>
                        Expires: {doc.expiryDate || 'No expiry'}
                      </span>
                      
                      {doc.verified ? (
                        <span className={styles['verified-indicator']} onClick={() => handleToggleDocVerification(doc.id, true)} style={{ cursor: 'pointer' }} title="Toggle to Unverify">
                          <ShieldCheck size={14} /> Verified
                        </span>
                      ) : (
                        <span className={styles['unverified-indicator']} onClick={() => handleToggleDocVerification(doc.id, false)} title="Click to verify document">
                          <ShieldAlert size={14} /> Unverified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

            {/* Document upload form */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Plus size={16} /> Upload Registry Document
            </h3>
            <form onSubmit={handleDocUpload} className={styles['upload-form']}>
              {uploadError && (
                <div className={listStyles['alert-danger']} style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                  {uploadError}
                </div>
              )}

              <div className={listStyles['form-group']}>
                <label className={listStyles['form-label']}>Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className={listStyles['form-input']}
                >
                  <option value="Insurance">Insurance Policy</option>
                  <option value="RC">Registration Certificate (RC)</option>
                  <option value="Pollution">Pollution Certificate (PUC)</option>
                  <option value="Permit">Road Permit</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div className={listStyles['form-group']}>
                <label className={listStyles['form-label']}>Expiration Date</label>
                <input 
                  type="date" 
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                  className={listStyles['form-input']}
                />
              </div>

              <div className={listStyles['form-group']}>
                <label className={listStyles['form-label']}>Upload File (PDF / Image)</label>
                <input 
                  type="file" 
                  id="document-file-input"
                  onChange={(e) => setDocFile(e.target.files[0])}
                  className={listStyles['form-input']}
                  accept=".pdf,image/*"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="button button-primary"
                disabled={uploading}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      {isEditModalOpen && (
        <div className={listStyles['modal-overlay']}>
          <div className={listStyles['modal-content']}>
            <div className={listStyles['modal-header']}>
              <h2>Edit Vehicle Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className={listStyles['close-btn']}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} autoComplete="off">
              <div className={listStyles['modal-body']}>
                {editError && (
                  <div className={listStyles['alert-danger']}>
                    {editError}
                  </div>
                )}

                <div className={listStyles['form-grid']}>
                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Registration Number *</label>
                    <input 
                      type="text" 
                      value={editFormData.registrationNumber}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      className={listStyles['form-input']}
                      required
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Vehicle Display Name *</label>
                    <input 
                      type="text" 
                      value={editFormData.vehicleName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, vehicleName: e.target.value }))}
                      className={listStyles['form-input']}
                      required
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Category *</label>
                    <select
                      value={editFormData.categoryId}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      className={listStyles['form-input']}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Fuel Type *</label>
                    <select
                      value={editFormData.fuelType}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, fuelType: e.target.value }))}
                      className={listStyles['form-input']}
                      required
                    >
                      <option value="DIESEL">Diesel</option>
                      <option value="PETROL">Petrol</option>
                      <option value="CNG">CNG</option>
                      <option value="EV">Electric (EV)</option>
                    </select>
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Manufacturer</label>
                    <input 
                      type="text" 
                      value={editFormData.manufacturer}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Model</label>
                    <input 
                      type="text" 
                      value={editFormData.model}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, model: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Year</label>
                    <input 
                      type="number" 
                      value={editFormData.year}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, year: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Max Load Capacity (kg) *</label>
                    <input 
                      type="number" 
                      value={editFormData.capacity}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, capacity: e.target.value }))}
                      className={listStyles['form-input']}
                      required
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Odometer Reading (km)</label>
                    <input 
                      type="number" 
                      value={editFormData.odometer}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, odometer: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Purchase Cost (INR)</label>
                    <input 
                      type="number" 
                      value={editFormData.purchaseCost}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, purchaseCost: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Current Location</label>
                    <input 
                      type="text" 
                      value={editFormData.currentLocation}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                      className={listStyles['form-input']}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="ON_TRIP">On Trip</option>
                      <option value="IN_SHOP">In Shop</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Insurance Expiry Date</label>
                    <input 
                      type="date" 
                      value={editFormData.insuranceExpiry}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>

                  <div className={listStyles['form-group']}>
                    <label className={listStyles['form-label']}>Pollution Expiry Date</label>
                    <input 
                      type="date" 
                      value={editFormData.pollutionExpiry}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, pollutionExpiry: e.target.value }))}
                      className={listStyles['form-input']}
                    />
                  </div>
                </div>
              </div>

              <div className={listStyles['modal-footer']}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
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
