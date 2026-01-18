import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format, addDays } from 'date-fns';
import {
  Plus,
  Search,
  FileText,
  Send,
  Download,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy
} from 'lucide-react';

function Invoices() {
  const invoices = useCrmStore((state) => state.invoices);
  const customers = useCrmStore((state) => state.customers);
  const services = useCrmStore((state) => state.services);
  const settings = useCrmStore((state) => state.settings);
  const addInvoice = useCrmStore((state) => state.addInvoice);
  const updateInvoice = useCrmStore((state) => state.updateInvoice);
  const deleteInvoice = useCrmStore((state) => state.deleteInvoice);
  const { format: formatCurrency } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    notes: '',
    dueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    status: 'draft'
  });

  const statusColors = {
    draft: '#64748b',
    sent: '#3b82f6',
    paid: '#22c55e',
    overdue: '#ef4444',
    cancelled: '#6b7280'
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const customer = customers.find(c => c.id === inv.customerId);
      const matchesSearch = 
        inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [invoices, customers, searchTerm, statusFilter]);

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleOpenModal = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        customerId: invoice.customerId || '',
        items: invoice.items || [{ description: '', quantity: 1, rate: 0 }],
        notes: invoice.notes || '',
        dueDate: invoice.dueDate || format(addDays(new Date(), 15), 'yyyy-MM-dd'),
        status: invoice.status || 'draft'
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        customerId: '',
        items: [{ description: '', quantity: 1, rate: 0 }],
        notes: '',
        dueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
        status: 'draft'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { subtotal, tax, total } = calculateTotals(formData.items);
    
    const invoiceData = {
      ...formData,
      subtotal,
      tax,
      total,
      taxRate: settings.taxRate
    };

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData);
    } else {
      addInvoice(invoiceData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ description: '', quantity: 1, rate: 0 }] });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'quantity' || field === 'rate' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, items: newItems });
  };

  const handleAddService = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFormData({
        ...formData,
        items: [...formData.items, { description: service.name, quantity: 1, rate: service.price }]
      });
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} />;
      case 'sent': return <Send size={14} />;
      case 'overdue': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const totals = calculateTotals(formData.items);

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Invoices</h1>
          <p>Create and manage professional invoices</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            New Invoice
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Filters */}
        <div className="filters">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map(status => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create your first invoice to start billing customers"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Create Invoice
              </button>
            }
          />
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td>
                        <strong style={{ color: 'var(--accent-primary)' }}>
                          {invoice.invoiceNumber}
                        </strong>
                      </td>
                      <td>{getCustomerName(invoice.customerId)}</td>
                      <td style={{ fontWeight: '600' }}>
                        {formatCurrency(invoice.total || 0)}
                      </td>
                      <td>{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: `${statusColors[invoice.status]}20`,
                            color: statusColors[invoice.status]
                          }}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </td>
                      <td>{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => setViewingInvoice(invoice)}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleOpenModal(invoice)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {invoice.status === 'draft' && (
                            <button 
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => updateInvoice(invoice.id, { status: 'sent' })}
                              title="Mark as Sent"
                              style={{ color: 'var(--info)' }}
                            >
                              <Send size={16} />
                            </button>
                          )}
                          {invoice.status === 'sent' && (
                            <button 
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => updateInvoice(invoice.id, { status: 'paid' })}
                              title="Mark as Paid"
                              style={{ color: 'var(--success)' }}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(invoice.id)}
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

      {/* Create/Edit Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvoice ? 'Edit Invoice' : 'New Invoice'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <select
                  className="form-select"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Quick Add Service */}
            <div className="form-group">
              <label className="form-label">Quick Add Service</label>
              <select
                className="form-select"
                onChange={(e) => {
                  if (e.target.value) handleAddService(e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="">Add a service...</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {formatCurrency(service.price)}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Items */}
            <div className="form-group">
              <label className="form-label">Items</label>
              <div style={{ 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {formData.items.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr auto', 
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      style={{ padding: '0.5rem' }}
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      style={{ padding: '0.5rem' }}
                      min="1"
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      style={{ padding: '0.5rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleRemoveItem(index)}
                      style={{ color: 'var(--error)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddItem}
                  style={{ marginTop: '0.5rem' }}
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>
            </div>

            {/* Totals */}
            <div style={{ 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Tax ({settings.taxRate}%):</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: '700',
                fontSize: '1.1rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <span>Total:</span>
                <span style={{ color: 'var(--accent-primary)' }}>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
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
              {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title={`Invoice ${viewingInvoice?.invoiceNumber}`}
      >
        {viewingInvoice && (
          <div className="modal-body">
            <div style={{ 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{settings.businessName}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {viewingInvoice.invoiceNumber}
                  </div>
                </div>
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: `${statusColors[viewingInvoice.status]}20`,
                    color: statusColors[viewingInvoice.status]
                  }}
                >
                  {viewingInvoice.status}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem',
                padding: '1rem 0',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Bill To:</div>
                  <div style={{ fontWeight: '500' }}>{getCustomerName(viewingInvoice.customerId)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Due Date:</div>
                  <div>{viewingInvoice.dueDate ? format(new Date(viewingInvoice.dueDate), 'MMM d, yyyy') : '-'}</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items?.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 0' }}>{item.description}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{formatCurrency(item.rate)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{formatCurrency(item.quantity * item.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <div style={{ marginBottom: '0.25rem' }}>Subtotal: {formatCurrency(viewingInvoice.subtotal || 0)}</div>
                <div style={{ marginBottom: '0.25rem' }}>Tax ({viewingInvoice.taxRate || settings.taxRate}%): {formatCurrency(viewingInvoice.tax || 0)}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                  Total: {formatCurrency(viewingInvoice.total || 0)}
                </div>
              </div>
            </div>

            {viewingInvoice.notes && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Notes:</strong> {viewingInvoice.notes}
              </div>
            )}
          </div>
        )}
        <div className="modal-footer">
          <button 
            className="btn btn-secondary"
            onClick={() => setViewingInvoice(null)}
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}

export default Invoices;
