import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCrmStore } from '../store/crmStore';
import { useNotifications } from '../hooks/useNotifications';
import { useCurrency } from '../hooks/useCurrency';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Clock,
  FileText,
  Wrench,
  ChevronRight,
  MessageSquare,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { filesToBase64, validateImageFile, getBase64ImageUrl } from '../utils/imageUpload';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobs = useCrmStore((state) => state.jobs);
  const customers = useCrmStore((state) => state.customers);
  const statuses = useCrmStore((state) => state.statuses);
  const services = useCrmStore((state) => state.services);
  const updateJob = useCrmStore((state) => state.updateJob);
  const deleteJob = useCrmStore((state) => state.deleteJob);
  const addJobImage = useCrmStore((state) => state.addJobImage);
  const deleteJobImage = useCrmStore((state) => state.deleteJobImage);
  const { notifyStatusUpdate, notifyJobDeleted } = useNotifications();
  const { format: formatCurrency } = useCurrency();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusImages, setStatusImages] = useState([]); // Array of { file, preview }

  const job = jobs.find(j => j.id === id);
  const customer = job ? customers.find(c => c.id === job.customerId) : null;

  if (!job) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <h3>Job not found</h3>
          <p>The job you're looking for doesn't exist or has been deleted.</p>
          <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const jobServices = (job.services || []).map(serviceId => 
    services.find(s => s.id === serviceId)
  ).filter(Boolean);

  const handleStatusChange = async () => {
    if (newStatus && newStatus !== job.status) {
      const oldStatus = job.status;
      updateJob(job.id, { 
        status: newStatus,
        statusNote: statusNote
      });
      
      // Save images if any
      if (statusImages.length > 0) {
        try {
          const imagePromises = statusImages.map(async (imgData) => {
            const base64 = await filesToBase64([imgData.file]);
            return base64[0];
          });
          const base64Images = await Promise.all(imagePromises);
          
          base64Images.forEach((base64Data) => {
            addJobImage(job.id, newStatus, base64Data);
          });
        } catch (error) {
          console.error('Failed to save images:', error);
          alert('Status updated but some images failed to upload. Please add them manually.');
        }
      }
      
      // Send WhatsApp notification
      await notifyStatusUpdate(job, oldStatus, newStatus, statusNote);
    }
    
    // Clean up
    statusImages.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setStatusImages([]);
    setIsStatusModalOpen(false);
    setStatusNote('');
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
      setStatusImages(prev => [...prev, ...validFiles]);
    }

    e.target.value = '';
  };

  const handleRemoveImage = (imageId) => {
    setStatusImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image && image.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const handleDeleteStoredImage = (status, imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      deleteJobImage(job.id, status, imageId);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      await notifyJobDeleted(job);
      deleteJob(job.id);
      navigate('/jobs');
    }
  };

  const getStatusProgress = () => {
    const status = statuses.find(s => s.id === job.status);
    if (!status) return 0;
    return (status.order / statuses.length) * 100;
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <button 
            className="btn btn-ghost"
            onClick={() => navigate('/jobs')}
            style={{ marginBottom: '0.5rem', marginLeft: '-0.5rem' }}
          >
            <ArrowLeft size={18} />
            Back to Jobs
          </button>
          <h1>{job.vehicleMake} {job.vehicleModel}</h1>
          <p>{job.vehicleYear} • {job.licensePlate}</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setNewStatus(job.status);
              setIsStatusModalOpen(true);
            }}
          >
            Update Status
          </button>
          <button 
            className="btn btn-ghost btn-icon"
            onClick={handleDelete}
            style={{ color: 'var(--error)' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Progress Bar */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Current Status
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Progress
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  {Math.round(getStatusProgress())}%
                </div>
              </div>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div 
                className="progress-fill" 
                style={{ width: `${getStatusProgress()}%` }}
              />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '0.75rem'
            }}>
              {statuses.map((status, index) => (
                <div 
                  key={status.id}
                  style={{ 
                    fontSize: '0.65rem',
                    color: status.id === job.status ? status.color : 'var(--text-muted)',
                    fontWeight: status.id === job.status ? '600' : '400',
                    textAlign: 'center',
                    flex: 1
                  }}
                >
                  {status.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Vehicle Details */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={18} />
                Vehicle Details
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Make & Model
                  </div>
                  <div style={{ fontWeight: '600' }}>
                    {job.vehicleMake} {job.vehicleModel}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Year
                    </div>
                    <div>{job.vehicleYear || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Color
                    </div>
                    <div>{job.vehicleColor || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      License Plate
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>{job.licensePlate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      VIN
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                      {job.vin || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} />
                Customer
              </h3>
            </div>
            <div className="card-body">
              {customer ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="customer-avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{customer.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Customer since {format(new Date(customer.createdAt), 'MMM yyyy')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{customer.phone || 'No phone'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{customer.email || 'No email'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                  No customer assigned
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
          {/* Services */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={18} />
                Services
              </h3>
              <div style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                {formatCurrency(job.totalPrice || 0)}
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {jobServices.length > 0 ? (
                jobServices.map((service, index) => (
                  <div 
                    key={service.id}
                    style={{
                      padding: '1rem 1.5rem',
                      borderBottom: index < jobServices.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{service.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {service.duration}
                      </div>
                    </div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(service.price)}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No services selected
                </div>
              )}
            </div>
          </div>

          {/* Job Info */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} />
                Job Info
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created</div>
                    <div>{format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last Updated</div>
                    <div>{format(new Date(job.updatedAt), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                </div>
                {job.estimatedCompletion && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={16} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Completion</div>
                      <div style={{ color: 'var(--accent-primary)' }}>
                        {format(new Date(job.estimatedCompletion), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {job.notes && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Notes
                  </div>
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem'
                  }}>
                    {job.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} />
              Activity Timeline
            </h3>
          </div>
          <div className="card-body">
            {job.history && job.history.length > 0 ? (
              <div className="timeline">
                {[...job.history].reverse().map((entry, index) => {
                  const status = statuses.find(s => s.id === entry.status);
                  return (
                    <div key={index} className="timeline-item">
                      <div className="timeline-date">
                        {format(new Date(entry.date), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="timeline-content">
                        <StatusBadge status={entry.status} />
                        {entry.note && (
                          <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {entry.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                No activity recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Job Images */}
        {job.images && Object.keys(job.images).length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={18} />
                Job Images
              </h3>
            </div>
            <div className="card-body">
              {Object.entries(job.images).map(([status, images]) => {
                const statusInfo = statuses.find(s => s.id === status);
                if (!images || images.length === 0) return null;
                
                return (
                  <div key={status} style={{ marginBottom: '2rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: statusInfo?.color || 'var(--accent-primary)'
                      }} />
                      <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>
                        {statusInfo?.name || status}
                      </h4>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginLeft: 'auto'
                      }}>
                        {images.length} {images.length === 1 ? 'image' : 'images'}
                      </span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '1rem'
                    }}>
                      {images.map((image) => (
                        <div
                          key={image.id}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          onClick={() => {
                            const url = getBase64ImageUrl(image.data);
                            window.open(url, '_blank');
                          }}
                        >
                          <img
                            src={getBase64ImageUrl(image.data)}
                            alt={`${statusInfo?.name || status} - ${format(new Date(image.uploadedAt), 'MMM d, yyyy')}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStoredImage(status, image.id);
                            }}
                            style={{
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.9)',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 1)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                          >
                            <X size={14} />
                          </button>
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                            padding: '0.5rem',
                            fontSize: '0.7rem',
                            color: 'white'
                          }}>
                            {format(new Date(image.uploadedAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          statusImages.forEach(img => {
            if (img.preview) URL.revokeObjectURL(img.preview);
          });
          setStatusImages([]);
          setIsStatusModalOpen(false);
        }}
        title="Update Status"
      >
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Add a note about this status change..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">
              <ImageIcon size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Upload Images for This Status
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
                id="status-image-upload"
              />
              <label
                htmlFor="status-image-upload"
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
            {statusImages.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                {statusImages.map((img) => (
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
            className="btn btn-secondary"
            onClick={() => setIsStatusModalOpen(false)}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleStatusChange}
          >
            Update Status
          </button>
        </div>
      </Modal>
    </>
  );
}

export default JobDetails;
