import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Car,
  DollarSign
} from 'lucide-react';

function Customers() {
  const customers = useCrmStore((state) => state.customers);
  const jobs = useCrmStore((state) => state.jobs);
  const { format: formatCurrency } = useCurrency();
  const addCustomer = useCrmStore((state) => state.addCustomer);
  const updateCustomer = useCrmStore((state) => state.updateCustomer);
  const deleteCustomer = useCrmStore((state) => state.deleteCustomer);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [customers, searchTerm]);

  const getCustomerStats = (customerId) => {
    const customerJobs = jobs.filter(j => j.customerId === customerId);
    const totalSpent = customerJobs.reduce((sum, j) => sum + (j.totalPrice || 0), 0);
    return {
      jobCount: customerJobs.length,
      totalSpent
    };
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    const customerJobs = jobs.filter(j => j.customerId === id);
    if (customerJobs.length > 0) {
      alert(`This customer has ${customerJobs.length} job(s) associated. Please delete those jobs first.`);
      return;
    }
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(id);
    }
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Customers</h1>
          <p>Manage your customer database</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </header>

      <div className="page-content">
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Start by adding your first customer"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add First Customer
              </button>
            }
          />
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
            gap: '1rem' 
          }}>
            {filteredCustomers.map(customer => {
              const stats = getCustomerStats(customer.id);
              return (
                <div key={customer.id} className="card animate-fade-in">
                  <div className="card-body">
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div 
                          className="customer-avatar" 
                          style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}
                        >
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {customer.name}
                          </h4>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Since {format(new Date(customer.createdAt), 'MMM yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="actions-cell">
                        <button 
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => handleOpenModal(customer)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => handleDelete(customer.id)}
                          style={{ color: 'var(--error)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gap: '0.5rem', 
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        {customer.phone || 'No phone'}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        {customer.email || 'No email'}
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Car size={14} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '0.875rem' }}>
                          <strong>{stats.jobCount}</strong> jobs
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem' }}>
                          <strong>{formatCurrency(stats.totalSpent)}</strong> spent
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter customer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g., +1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="customer@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Any additional notes about this customer..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Customers;
