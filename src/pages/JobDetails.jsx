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
  MessageSquare
} from 'lucide-react';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobs = useCrmStore((state) => state.jobs);
  const customers = useCrmStore((state) => state.customers);
  const statuses = useCrmStore((state) => state.statuses);
  const services = useCrmStore((state) => state.services);
  const updateJob = useCrmStore((state) => state.updateJob);
  const deleteJob = useCrmStore((state) => state.deleteJob);
  const { notifyStatusUpdate, notifyJobDeleted } = useNotifications();
  const { format: formatCurrency } = useCurrency();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

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
      
      // Send WhatsApp notification
      await notifyStatusUpdate(job, oldStatus, newStatus, statusNote);
    }
    setIsStatusModalOpen(false);
    setStatusNote('');
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
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
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
