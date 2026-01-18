import { useState } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  Plus,
  Wrench,
  Edit2,
  Trash2,
  Clock,
  DollarSign
} from 'lucide-react';

function Services() {
  const services = useCrmStore((state) => state.services);
  const addService = useCrmStore((state) => state.addService);
  const updateService = useCrmStore((state) => state.updateService);
  const deleteService = useCrmStore((state) => state.deleteService);
  const jobs = useCrmStore((state) => state.jobs);
  const { format: formatCurrency, symbol: currencySymbol } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    description: ''
  });

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name || '',
        price: service.price || '',
        duration: service.duration || '',
        description: service.description || ''
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        price: '',
        duration: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const serviceData = {
      ...formData,
      price: parseFloat(formData.price) || 0
    };

    if (editingService) {
      updateService(editingService.id, serviceData);
    } else {
      addService(serviceData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    // Check if service is used in any jobs
    const usedInJobs = jobs.some(job => job.services?.includes(id));
    if (usedInJobs) {
      alert('This service is used in existing jobs. You can edit it, but cannot delete it.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteService(id);
    }
  };

  const getServiceUsageCount = (serviceId) => {
    return jobs.filter(job => job.services?.includes(serviceId)).length;
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Services</h1>
          <p>Manage your service catalog and pricing</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Service
          </button>
        </div>
      </header>

      <div className="page-content">
        {services.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No services yet"
            description="Add services you offer to include them in jobs"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add First Service
              </button>
            }
          />
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1rem' 
          }}>
            {services.map(service => {
              const usageCount = getServiceUsageCount(service.id);
              return (
                <div key={service.id} className="card animate-fade-in">
                  <div className="card-body">
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255, 107, 53, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-primary)'
                        }}>
                          <Wrench size={20} />
                        </div>
                        <div>
                          <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {service.name}
                          </h4>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Clock size={12} />
                            {service.duration || 'Not specified'}
                          </div>
                        </div>
                      </div>
                      <div className="actions-cell">
                        <button 
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => handleOpenModal(service)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => handleDelete(service.id)}
                          style={{ color: 'var(--error)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {service.description && (
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem'
                      }}>
                        {service.description}
                      </p>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700',
                        color: 'var(--accent-primary)'
                      }}>
                        {formatCurrency(service.price || 0)}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)',
                        background: 'var(--bg-tertiary)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '10px'
                      }}>
                        Used in {usageCount} job{usageCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add Service'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Service Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Full Body Wrap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price ({currencySymbol}) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 2-3 days"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe what this service includes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
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
              {editingService ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Services;
