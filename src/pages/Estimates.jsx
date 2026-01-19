import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format, addDays } from 'date-fns';
import { sendEstimateEmail } from '../utils/email';
import { sendWhatsAppNotification, formatJobNotification } from '../utils/whatsapp';
import {
  Plus,
  Search,
  FileText,
  Send,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';

function Estimates() {
  const estimates = useCrmStore((state) => state.estimates);
  const customers = useCrmStore((state) => state.customers);
  const services = useCrmStore((state) => state.services);
  const settings = useCrmStore((state) => state.settings);
  const addEstimate = useCrmStore((state) => state.addEstimate);
  const updateEstimate = useCrmStore((state) => state.updateEstimate);
  const deleteEstimate = useCrmStore((state) => state.deleteEstimate);
  const convertEstimateToInvoice = useCrmStore((state) => state.convertEstimateToInvoice);
  const { format: formatCurrency } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingEstimate, setViewingEstimate] = useState(null);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    notes: '',
    validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: 'draft'
  });

  const statusColors = {
    draft: '#64748b',
    sent: '#3b82f6',
    accepted: '#22c55e',
    declined: '#ef4444',
    expired: '#6b7280'
  };

  const filteredEstimates = useMemo(() => {
    return estimates.filter(est => {
      const customer = customers.find(c => c.id === est.customerId);
      const matchesSearch = 
        est.estimateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || est.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [estimates, customers, searchTerm, statusFilter]);

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleOpenModal = (estimate = null) => {
    if (estimate) {
      setEditingEstimate(estimate);
      setFormData({
        customerId: estimate.customerId || '',
        items: estimate.items || [{ description: '', quantity: 1, rate: 0 }],
        notes: estimate.notes || '',
        validUntil: estimate.validUntil || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        status: estimate.status || 'draft'
      });
    } else {
      setEditingEstimate(null);
      setFormData({
        customerId: '',
        items: [{ description: '', quantity: 1, rate: 0 }],
        notes: '',
        validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        status: 'draft'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { subtotal, tax, total } = calculateTotals(formData.items);
    
    const estimateData = {
      ...formData,
      subtotal,
      tax,
      total,
      taxRate: settings.taxRate
    };

    if (editingEstimate) {
      updateEstimate(editingEstimate.id, estimateData);
    } else {
      addEstimate(estimateData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this estimate?')) {
      deleteEstimate(id);
    }
  };

  const handleSendEstimate = async (estimate) => {
    const customer = customers.find(c => c.id === estimate.customerId);
    if (!customer) {
      alert('Customer not found');
      return;
    }

    // Check if customer has email or phone
    if (!customer.email && !customer.phone) {
      alert('Customer does not have an email or phone number. Please add contact information first.');
      return;
    }

    // Generate public link
    const baseUrl = window.location.origin;
    const estimateLink = `${baseUrl}/estimate/${estimate.publicToken}`;

    const sentVia = [];
    const errors = [];

    try {
      // Update status to sent
      updateEstimate(estimate.id, { status: 'sent' });

      // Send email if configured and customer has email
      if (settings.emailjs?.enabled && settings.emailjs?.serviceId && settings.emailjs?.templateId && settings.emailjs?.publicKey) {
        if (customer.email) {
          try {
            await sendEstimateEmail({
              serviceId: settings.emailjs.serviceId,
              templateId: settings.emailjs.templateId,
              publicKey: settings.emailjs.publicKey,
              toEmail: customer.email,
              toName: customer.name,
              estimateNumber: estimate.estimateNumber,
              estimateLink: estimateLink,
              businessName: settings.businessName,
              items: estimate.items || [],
              subtotal: estimate.subtotal || 0,
              tax: estimate.tax || 0,
              total: estimate.total || 0,
              validUntil: estimate.validUntil ? format(new Date(estimate.validUntil), 'MMM d, yyyy') : 'N/A'
            });
            sentVia.push('Email');
            console.log('Estimate email sent successfully');
          } catch (error) {
            console.error('Failed to send email:', error);
            errors.push(`Email: ${error.message}`);
          }
        } else {
          errors.push('Email: Customer does not have an email address');
        }
      } else {
        errors.push('Email: EmailJS not configured in Settings');
      }

      // Send WhatsApp if configured and customer has phone
      if (settings.whatsapp?.enabled && settings.whatsapp?.apiKey) {
        if (customer.phone) {
          try {
            const whatsappMessage = formatJobNotification('estimate_sent', {
              estimateNumber: estimate.estimateNumber,
              businessName: settings.businessName,
              items: estimate.items || [],
              subtotal: estimate.subtotal || 0,
              tax: estimate.tax || 0,
              total: estimate.total || 0,
              validUntil: estimate.validUntil ? format(new Date(estimate.validUntil), 'MMM d, yyyy') : 'N/A',
              estimateLink: estimateLink
            });
            
            await sendWhatsAppNotification(
              customer.phone,
              settings.whatsapp.apiKey,
              whatsappMessage
            );
            sentVia.push('WhatsApp');
            console.log('Estimate WhatsApp sent successfully');
          } catch (error) {
            console.error('Failed to send WhatsApp:', error);
            errors.push(`WhatsApp: ${error.message || 'Failed to send'}`);
          }
        } else {
          errors.push('WhatsApp: Customer does not have a phone number');
        }
      } else {
        errors.push('WhatsApp: WhatsApp not configured in Settings');
      }

      // Show success/error message
      if (sentVia.length > 0) {
        alert(`✅ Estimate sent successfully via ${sentVia.join(' and ')}!\n\nEstimate #${estimate.estimateNumber} has been sent to ${customer.name}.${errors.length > 0 ? `\n\n⚠️ Issues:\n${errors.join('\n')}` : ''}`);
      } else {
        alert(`❌ Failed to send estimate.\n\n${errors.join('\n')}\n\nPlease configure EmailJS or WhatsApp in Settings, or ensure the customer has contact information.`);
        // Revert status if nothing was sent
        updateEstimate(estimate.id, { status: 'draft' });
      }
    } catch (error) {
      console.error('Error sending estimate:', error);
      alert('Failed to send estimate. Please try again.');
      // Revert status on error
      updateEstimate(estimate.id, { status: 'draft' });
    }
  };

  const handleCopyLink = (estimate) => {
    const baseUrl = window.location.origin;
    const estimateLink = `${baseUrl}/estimate/${estimate.publicToken}`;
    navigator.clipboard.writeText(estimateLink).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = estimateLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    });
  };

  const handleConvertToInvoice = (id) => {
    if (window.confirm('Convert this estimate to an invoice?')) {
      convertEstimateToInvoice(id);
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
      case 'accepted': return <CheckCircle size={14} />;
      case 'sent': return <Send size={14} />;
      case 'declined': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const totals = calculateTotals(formData.items);

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Estimates</h1>
          <p>Create quotes and convert them to invoices</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search estimates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            New Estimate
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Filters */}
        <div className="filters">
          {['all', 'draft', 'sent', 'accepted', 'declined'].map(status => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {estimates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No estimates yet"
            description="Create estimates and send them to potential customers"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Create Estimate
              </button>
            }
          />
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Estimate #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEstimates.map(estimate => (
                    <tr key={estimate.id}>
                      <td>
                        <strong style={{ color: 'var(--accent-primary)' }}>
                          {estimate.estimateNumber}
                        </strong>
                      </td>
                      <td>{getCustomerName(estimate.customerId)}</td>
                      <td style={{ fontWeight: '600' }}>
                        {formatCurrency(estimate.total || 0)}
                      </td>
                      <td>{estimate.validUntil ? format(new Date(estimate.validUntil), 'MMM d, yyyy') : '-'}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: `${statusColors[estimate.status]}20`,
                            color: statusColors[estimate.status]
                          }}
                        >
                          {getStatusIcon(estimate.status)}
                          {estimate.status}
                        </span>
                      </td>
                      <td>{format(new Date(estimate.createdAt), 'MMM d, yyyy')}</td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => setViewingEstimate(estimate)}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleOpenModal(estimate)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {estimate.status === 'draft' && (
                            <button 
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => handleSendEstimate(estimate)}
                              title="Send Estimate (Email & WhatsApp)"
                              style={{ color: 'var(--info)' }}
                            >
                              <Send size={16} />
                            </button>
                          )}
                          {estimate.status === 'sent' && estimate.publicToken && (
                            <>
                              <button 
                                className="btn btn-ghost btn-sm btn-icon"
                                onClick={() => handleCopyLink(estimate)}
                                title="Copy Public Link"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                <Copy size={16} />
                              </button>
                              <a
                                href={`/estimate/${estimate.publicToken}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm btn-icon"
                                title="View Public Page"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                <ExternalLink size={16} />
                              </a>
                            </>
                          )}
                          {(estimate.status === 'sent' || estimate.status === 'accepted') && (
                            <button 
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => handleConvertToInvoice(estimate.id)}
                              title="Convert to Invoice"
                              style={{ color: 'var(--success)' }}
                            >
                              <ArrowRight size={16} />
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(estimate.id)}
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

      {/* Create/Edit Estimate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEstimate ? 'Edit Estimate' : 'New Estimate'}
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
                <label className="form-label">Valid Until</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
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

            {/* Estimate Items */}
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
              {editingEstimate ? 'Update Estimate' : 'Create Estimate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Estimate Modal */}
      <Modal
        isOpen={!!viewingEstimate}
        onClose={() => setViewingEstimate(null)}
        title={`Estimate ${viewingEstimate?.estimateNumber}`}
      >
        {viewingEstimate && (
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
                    {viewingEstimate.estimateNumber}
                  </div>
                </div>
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: `${statusColors[viewingEstimate.status]}20`,
                    color: statusColors[viewingEstimate.status]
                  }}
                >
                  {viewingEstimate.status}
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Prepared For:</div>
                  <div style={{ fontWeight: '500' }}>{getCustomerName(viewingEstimate.customerId)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Valid Until:</div>
                  <div>{viewingEstimate.validUntil ? format(new Date(viewingEstimate.validUntil), 'MMM d, yyyy') : '-'}</div>
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
                  {viewingEstimate.items?.map((item, i) => (
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
                <div style={{ marginBottom: '0.25rem' }}>Subtotal: {formatCurrency(viewingEstimate.subtotal || 0)}</div>
                <div style={{ marginBottom: '0.25rem' }}>Tax ({viewingEstimate.taxRate || settings.taxRate}%): {formatCurrency(viewingEstimate.tax || 0)}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                  Total: {formatCurrency(viewingEstimate.total || 0)}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="modal-footer">
          {viewingEstimate?.status !== 'accepted' && (
            <button 
              className="btn btn-success"
              onClick={() => {
                handleConvertToInvoice(viewingEstimate.id);
                setViewingEstimate(null);
              }}
            >
              <ArrowRight size={16} />
              Convert to Invoice
            </button>
          )}
          <button 
            className="btn btn-secondary"
            onClick={() => setViewingEstimate(null)}
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}

export default Estimates;
