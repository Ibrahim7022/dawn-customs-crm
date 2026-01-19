import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrmStore } from '../store/crmStore';
import { useNotifications } from '../hooks/useNotifications';
import { useCurrency } from '../hooks/useCurrency';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Search,
  Car,
  Filter,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { filesToBase64, validateImageFile, getBase64ImageUrl } from '../utils/imageUpload';

function Jobs() {
  const navigate = useNavigate();
  const jobs = useCrmStore((state) => state.jobs);
  const customers = useCrmStore((state) => state.customers);
  const statuses = useCrmStore((state) => state.statuses);
  const services = useCrmStore((state) => state.services);
  const addJob = useCrmStore((state) => state.addJob);
  const updateJob = useCrmStore((state) => state.updateJob);
  const deleteJob = useCrmStore((state) => state.deleteJob);
  const addCustomer = useCrmStore((state) => state.addCustomer);
  const addJobImage = useCrmStore((state) => state.addJobImage);
  const { notifyNewJob, notifyNewCustomer } = useNotifications();
  const { format: formatCurrency } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    customerId: '',
    newCustomerName: '',
    newCustomerPhone: '',
    newCustomerEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    vin: '',
    services: [],
    notes: '',
    estimatedCompletion: '',
    status: 'received'
  });
  const [jobImages, setJobImages] = useState([]); // Array of { file, preview }

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.vehicleMake?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers.find(c => c.id === job.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [jobs, customers, searchTerm, statusFilter]);

  const groupedJobs = useMemo(() => {
    const grouped = {};
    statuses.forEach(status => {
      grouped[status.id] = filteredJobs.filter(j => j.status === status.id);
    });
    return grouped;
  }, [filteredJobs, statuses]);

  const handleOpenModal = (job = null) => {
    // Clean up image previews
    jobImages.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setJobImages([]);

    if (job) {
      setEditingJob(job);
      setFormData({
        customerId: job.customerId || '',
        newCustomerName: '',
        newCustomerPhone: '',
        newCustomerEmail: '',
        vehicleMake: job.vehicleMake || '',
        vehicleModel: job.vehicleModel || '',
        vehicleYear: job.vehicleYear || '',
        vehicleColor: job.vehicleColor || '',
        licensePlate: job.licensePlate || '',
        vin: job.vin || '',
        services: job.services || [],
        notes: job.notes || '',
        estimatedCompletion: job.estimatedCompletion || '',
        status: job.status || 'received'
      });
    } else {
      setEditingJob(null);
      setFormData({
        customerId: '',
        newCustomerName: '',
        newCustomerPhone: '',
        newCustomerEmail: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehicleColor: '',
        licensePlate: '',
        vin: '',
        services: [],
        notes: '',
        estimatedCompletion: '',
        status: 'received'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let customerId = formData.customerId;
    let newCustomerData = null;
    
    // Create new customer if needed
    if (!customerId && formData.newCustomerName) {
      newCustomerData = {
        name: formData.newCustomerName,
        phone: formData.newCustomerPhone,
        email: formData.newCustomerEmail
      };
      addCustomer(newCustomerData);
      // Get the new customer ID (will be the last one added)
      const allCustomers = useCrmStore.getState().customers;
      customerId = allCustomers[allCustomers.length - 1].id;
      
      // Send new customer notification
      notifyNewCustomer(newCustomerData);
    }

    const totalPrice = formData.services.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const jobData = {
      customerId,
      vehicleMake: formData.vehicleMake,
      vehicleModel: formData.vehicleModel,
      vehicleYear: formData.vehicleYear,
      vehicleColor: formData.vehicleColor,
      licensePlate: formData.licensePlate,
      vin: formData.vin,
      services: formData.services,
      notes: formData.notes,
      estimatedCompletion: formData.estimatedCompletion,
      status: formData.status,
      totalPrice
    };

    let newJobId;
    if (editingJob) {
      updateJob(editingJob.id, jobData);
      newJobId = editingJob.id;
    } else {
      const newJob = { ...jobData, id: uuidv4() };
      addJob(jobData);
      // Get the job ID (will be the last one added)
      const allJobs = useCrmStore.getState().jobs;
      newJobId = allJobs[allJobs.length - 1].id;
      // Send new job notification
      notifyNewJob(jobData);
    }

    // Save images if any
    if (jobImages.length > 0 && newJobId) {
      try {
        const imagePromises = jobImages.map(async (imgData) => {
          const base64 = await filesToBase64([imgData.file]);
          return base64[0];
        });
        const base64Images = await Promise.all(imagePromises);
        
        base64Images.forEach((base64Data) => {
          addJobImage(newJobId, formData.status, base64Data);
        });
      } catch (error) {
        console.error('Failed to save images:', error);
        alert('Job created but some images failed to upload. Please add them manually.');
      }
    }

    // Reset form
    setJobImages([]);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteJob(id);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        const preview = URL.createObjectURL(file);
        validFiles.push({ file, preview, id: Date.now() + Math.random() });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setJobImages(prev => [...prev, ...validFiles]);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (imageId) => {
    setJobImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image && image.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Jobs</h1>
          <p>Manage and track all your vehicle customization jobs</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            New Job
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Filters */}
        <div className="filters">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Jobs
            </button>
            {statuses.slice(0, 5).map(status => (
              <button
                key={status.id}
                className={`filter-btn ${statusFilter === status.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(status.id)}
              >
                {status.name}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-ghost btn-icon ${viewMode === 'kanban' ? 'btn-secondary' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`btn btn-ghost btn-icon ${viewMode === 'list' ? 'btn-secondary' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No jobs yet"
            description="Start by adding your first job to track vehicle customizations"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add First Job
              </button>
            }
          />
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="kanban-board">
            {statuses.map(status => (
              <div key={status.id} className="kanban-column">
                <div className="kanban-header">
                  <div className="kanban-title">
                    <span 
                      style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        background: status.color 
                      }} 
                    />
                    {status.name}
                  </div>
                  <span className="kanban-count">{groupedJobs[status.id]?.length || 0}</span>
                </div>
                <div className="kanban-body">
                  {groupedJobs[status.id]?.map(job => (
                    <div 
                      key={job.id} 
                      className="kanban-card"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div className="kanban-card-title">
                        {job.vehicleMake} {job.vehicleModel}
                      </div>
                      <div className="kanban-card-meta">
                        <span>{job.licensePlate}</span>
                        <span>•</span>
                        <span>{getCustomerName(job.customerId)}</span>
                      </div>
                      {job.estimatedCompletion && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.7rem', 
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Calendar size={12} />
                          Due: {format(new Date(job.estimatedCompletion), 'MMM d')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Customer</th>
                    <th>License Plate</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div className="vehicle-info">
                          <div className="vehicle-avatar">
                            <Car size={18} />
                          </div>
                          <div className="vehicle-details">
                            <h4>{job.vehicleMake} {job.vehicleModel}</h4>
                            <p>{job.vehicleYear} • {job.vehicleColor}</p>
                          </div>
                        </div>
                      </td>
                      <td>{getCustomerName(job.customerId)}</td>
                      <td>{job.licensePlate}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td>{format(new Date(job.createdAt), 'MMM d, yyyy')}</td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleOpenModal(job)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(job.id)}
                            title="Delete"
                            style={{ color: 'var(--error)' }}
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
      </div>

      {/* Add/Edit Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? 'Edit Job' : 'New Job'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Customer Selection */}
            <div className="form-group">
              <label className="form-label">Customer</label>
              <select
                className="form-select"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              >
                <option value="">Select existing or add new below</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            {!formData.customerId && (
              <div style={{ 
                padding: '1rem', 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Or add new customer:
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Customer Name"
                      value={formData.newCustomerName}
                      onChange={(e) => setFormData({ ...formData, newCustomerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Phone Number"
                      value={formData.newCustomerPhone}
                      onChange={(e) => setFormData({ ...formData, newCustomerPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Email (optional)"
                    value={formData.newCustomerEmail}
                    onChange={(e) => setFormData({ ...formData, newCustomerEmail: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Vehicle Information */}
            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              VEHICLE INFORMATION
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., BMW, Mercedes"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Model *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., M5, AMG GT"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 2024"
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Black"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Plate *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., ABC 1234"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">VIN (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vehicle Identification Number"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                />
              </div>
            </div>

            {/* Services */}
            <div className="form-group">
              <label className="form-label">Services</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '0.5rem',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '0.5rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)'
              }}>
                {services.map(service => (
                  <label 
                    key={service.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: formData.services.includes(service.id) ? 'var(--bg-elevated)' : 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                    />
                    <span style={{ fontSize: '0.8rem' }}>{service.name}</span>
                    <span style={{ 
                      marginLeft: 'auto', 
                      fontSize: '0.7rem', 
                      color: 'var(--accent-primary)' 
                    }}>
                      {formatCurrency(service.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Completion</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.estimatedCompletion}
                  onChange={(e) => setFormData({ ...formData, estimatedCompletion: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Any special instructions or notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">
                <ImageIcon size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Images for {statuses.find(s => s.id === formData.status)?.name || 'Current Status'}
              </label>
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--accent-primary)10';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  const event = { target: { files: files, value: '' } };
                  handleImageUpload(event);
                }
              }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="job-image-upload"
                />
                <label
                  htmlFor="job-image-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Click to upload or drag and drop
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    JPEG, PNG, GIF, WebP (Max 5MB each)
                  </span>
                </label>
              </div>

              {/* Image Previews */}
              {jobImages.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '1rem'
                }}>
                  {jobImages.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <img
                        src={img.preview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.7)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingJob ? 'Update Job' : 'Create Job'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Jobs;
