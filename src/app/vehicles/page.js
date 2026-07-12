'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Trash2, X } from 'lucide-react';
import styles from './vehicles.module.css';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Add Vehicle Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // New Vehicle Form Inputs
  const [formData, setFormData] = useState({
    registrationNumber: '',
    vehicleName: '',
    categoryId: '',
    manufacturer: '',
    model: '',
    year: '',
    capacity: '',
    odometer: '',
    fuelType: 'DIESEL',
    purchaseCost: '',
    status: 'AVAILABLE',
    currentLocation: '',
    insuranceExpiry: '',
    pollutionExpiry: ''
  });

  // Fetch Vehicles & Categories
  const fetchVehicles = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (typeFilter) query.append('type', typeFilter);

    fetch(`/api/vehicles?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching vehicles:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // Fetch categories once
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter, typeFilter]);

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Form submit handler
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError('');

    // Required fields check
    if (!formData.registrationNumber || !formData.vehicleName || !formData.categoryId || !formData.capacity || !formData.fuelType) {
      setFormError('Please fill out all required fields (*)');
      return;
    }

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vehicle');
      }

      // Refresh list, close modal, reset form
      fetchVehicles();
      setIsAddModalOpen(false);
      setFormData({
        registrationNumber: '',
        vehicleName: '',
        categoryId: '',
        manufacturer: '',
        model: '',
        year: '',
        capacity: '',
        odometer: '',
        fuelType: 'DIESEL',
        purchaseCost: '',
        status: 'AVAILABLE',
        currentLocation: '',
        insuranceExpiry: '',
        pollutionExpiry: ''
      });
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Delete vehicle handler
  const handleDeleteVehicle = async (id) => {
    setDeleteError('');
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete vehicle');
      }

      fetchVehicles();
    } catch (err) {
      setDeleteError(err.message);
      // Auto clear delete error after 5s
      setTimeout(() => setDeleteError(''), 5000);
    }
  };

  return (
    <div>
      {/* Header Row */}
      <div className={styles['header-row']}>
        <div className={styles['title-area']}>
          <h1>Vehicle Registry</h1>
          <p>Register and manage fleet vehicles, load limits, and document compliance.</p>
        </div>
        <button 
          onClick={() => {
            setFormError('');
            setFormData({
              registrationNumber: '',
              vehicleName: '',
              categoryId: '',
              manufacturer: '',
              model: '',
              year: '',
              capacity: '',
              odometer: '',
              fuelType: 'DIESEL',
              purchaseCost: '',
              status: 'AVAILABLE',
              currentLocation: '',
              insuranceExpiry: '',
              pollutionExpiry: ''
            });
            setIsAddModalOpen(true);
          }} 
          className="button button-primary"
        >
          <Plus size={16} /> Register Vehicle
        </button>
      </div>

      {/* Error alert for delete blocks */}
      {deleteError && (
        <div className={styles['alert-danger']} style={{ marginBottom: '1.5rem' }}>
          <strong>Deletion Blocked:</strong> {deleteError}
        </div>
      )}

      {/* Filters Row */}
      <div className={styles['controls-row']}>
        <div className={styles['search-filter-group']}>
          {/* Search bar */}
          <div className={styles['search-input-wrapper']}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by registration, name, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles['input-field']}
            />
          </div>

          {/* Category/Type Filter */}
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles['select-field']}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles['select-field']}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Vehicle List Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading registry...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No vehicles found matching the filters.</p>
        </div>
      ) : (
        <div className={styles['table-wrapper']}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Vehicle Details</th>
                <th className={styles.th}>Registration</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Capacity (Max Load)</th>
                <th className={styles.th}>Odometer</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{vehicle.vehicleName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {vehicle.manufacturer || 'N/A'} {vehicle.model || 'N/A'} {vehicle.year ? `(${vehicle.year})` : ''}
                    </div>
                  </td>
                  <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                    {vehicle.registrationNumber}
                  </td>
                  <td className={styles.td}>
                    {vehicle.category?.name || 'N/A'}
                  </td>
                  <td className={styles.td}>
                    {vehicle.capacity?.toLocaleString()} kg
                  </td>
                  <td className={styles.td}>
                    {vehicle.odometer?.toLocaleString()} km
                  </td>
                  <td className={styles.td}>
                    <span className={`badge badge-${vehicle.status.toLowerCase()}`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles['action-links']}>
                      <Link 
                        href={`/vehicles/${vehicle.id}`}
                        className={`${styles['action-btn']} ${styles['action-btn-view']}`}
                      >
                        <Eye size={14} /> View
                      </Link>
                      <button 
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className={`${styles['action-btn']} ${styles['action-btn-delete']}`}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-content']}>
            <div className={styles['modal-header']}>
              <h2>Register New Vehicle</h2>
              <button onClick={() => setIsAddModalOpen(false)} className={styles['close-btn']}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddVehicle} autoComplete="off">
              <div className={styles['modal-body']}>
                {formError && (
                  <div className={styles['alert-danger']}>
                    {formError}
                  </div>
                )}

                <div className={styles['form-grid']}>
                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Registration Number *</label>
                    <input 
                      type="text" 
                      name="registrationNumber"
                      placeholder="e.g. MH-12-HE-1234"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      required
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Vehicle Display Name *</label>
                    <input 
                      type="text" 
                      name="vehicleName"
                      placeholder="e.g. Eicher Pro 2049"
                      value={formData.vehicleName}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      required
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Category *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Fuel Type *</label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      required
                    >
                      <option value="DIESEL">Diesel</option>
                      <option value="PETROL">Petrol</option>
                      <option value="CNG">CNG</option>
                      <option value="EV">Electric (EV)</option>
                    </select>
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Manufacturer</label>
                    <input 
                      type="text" 
                      name="manufacturer"
                      placeholder="e.g. Eicher"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Model</label>
                    <input 
                      type="text" 
                      name="model"
                      placeholder="e.g. Pro 2049"
                      value={formData.model}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Year</label>
                    <input 
                      type="number" 
                      name="year"
                      placeholder="e.g. 2023"
                      value={formData.year}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Max Load Capacity (kg) *</label>
                    <input 
                      type="number" 
                      name="capacity"
                      placeholder="e.g. 3500"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      required
                      min="1"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Initial Odometer (km)</label>
                    <input 
                      type="number" 
                      name="odometer"
                      placeholder="e.g. 15000"
                      value={formData.odometer}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      min="0"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Purchase Cost (INR)</label>
                    <input 
                      type="number" 
                      name="purchaseCost"
                      placeholder="e.g. 1200000"
                      value={formData.purchaseCost}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      min="0"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Initial Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_SHOP">In Shop</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Current Location</label>
                    <input 
                      type="text" 
                      name="currentLocation"
                      placeholder="e.g. Depot-A"
                      value={formData.currentLocation}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Insurance Expiry Date</label>
                    <input 
                      type="date" 
                      name="insuranceExpiry"
                      value={formData.insuranceExpiry}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Pollution Expiry Date</label>
                    <input 
                      type="date" 
                      name="pollutionExpiry"
                      value={formData.pollutionExpiry}
                      onChange={handleInputChange}
                      className={styles['form-input']}
                    />
                  </div>
                </div>
              </div>

              <div className={styles['modal-footer']}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
