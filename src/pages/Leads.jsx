import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  UserPlus,
  Phone,
  Mail,
  Building,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  Calendar,
  MessageSquare
} from 'lucide-react';

function Leads() {
  const leads = useCrmStore((state) => state.leads);
  const leadStatuses = useCrmStore((state) => state.leadStatuses);
  const addLead = useCrmStore((state) => state.addLead);
  const updateLead = useCrmStore((state) => state.updateLead);
  const deleteLead = useCrmStore((state) => state.deleteLead);
  const convertLeadToCustomer = useCrmStore((state) => state.convertLeadToCustomer);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    value: '',
    notes: '',
    status: 'new'
  });

  const sourceOptions = [
    'Website', 'Referral', 'Social Media', 'Walk-in', 'Phone Inquiry', 
    'Advertisement', 'Trade Show', 'Partner', 'Other'
  ];

  const filteredLeads = useMemo(() => {
    return leads.filter(lead =>
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  const groupedLeads = useMemo(() => {
    const grouped = {};
    leadStatuses.forEach(status => {
      grouped[status.id] = filteredLeads.filter(l => l.status === status.id);
    });
    return grouped;
  }, [filteredLeads, leadStatuses]);

  const handleOpenModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source || '',
        value: lead.value || '',
        notes: lead.notes || '',
        status: lead.status || 'new'
      });
    } else {
      setEditingLead(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: '',
        value: '',
        notes: '',
        status: 'new'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const leadData = {
      ...formData,
      value: parseFloat(formData.value) || 0
    };

    if (editingLead) {
      updateLead(editingLead.id, leadData);
    } else {
      addLead(leadData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteLead(id);
    }
  };

  const handleConvert = (id) => {
    if (window.confirm('Convert this lead to a customer?')) {
      convertLeadToCustomer(id);
    }
  };

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, statusId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    updateLead(leadId, { status: statusId });
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Leads</h1>
          <p>Track and manage your potential customers</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Lead
          </button>
        </div>
      </header>

      <div className="page-content">
        {leads.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No leads yet"
            description="Start capturing potential customers by adding your first lead"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add First Lead
              </button>
            }
          />
        ) : (
          <div className="kanban-board">
            {leadStatuses.map(status => (
              <div 
                key={status.id} 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.id)}
              >
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
                  <span className="kanban-count">{groupedLeads[status.id]?.length || 0}</span>
                </div>
                <div className="kanban-body">
                  {groupedLeads[status.id]?.map(lead => (
                    <div 
                      key={lead.id} 
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="kanban-card-title">{lead.name}</div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {status.id !== 'won' && status.id !== 'lost' && (
                            <button 
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => handleConvert(lead.id)}
                              title="Convert to Customer"
                              style={{ color: 'var(--success)' }}
                            >
                              <UserCheck size={14} />
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleOpenModal(lead)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(lead.id)}
                            style={{ color: 'var(--error)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {lead.company && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          <Building size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                          {lead.company}
                        </div>
                      )}
                      <div className="kanban-card-meta" style={{ marginTop: '0.5rem' }}>
                        {lead.phone && <span><Phone size={10} /> {lead.phone}</span>}
                        {lead.source && <span>• {lead.source}</span>}
                      </div>
                      {lead.value > 0 && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.8rem', 
                          fontWeight: '600',
                          color: 'var(--accent-primary)'
                        }}>
                          ₹{lead.value.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Lead name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Potential Value (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Source</label>
                <select
                  className="form-select"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="">Select source</option>
                  {sourceOptions.map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {leadStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Additional notes..."
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
              {editingLead ? 'Update Lead' : 'Add Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Leads;
