import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  MessageSquare,
  Ticket,
  Edit2,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle
} from 'lucide-react';

function Support() {
  const tickets = useCrmStore((state) => state.tickets);
  const customers = useCrmStore((state) => state.customers);
  const ticketStatuses = useCrmStore((state) => state.ticketStatuses);
  const ticketPriorities = useCrmStore((state) => state.ticketPriorities);
  const addTicket = useCrmStore((state) => state.addTicket);
  const updateTicket = useCrmStore((state) => state.updateTicket);
  const addTicketReply = useCrmStore((state) => state.addTicketReply);
  const deleteTicket = useCrmStore((state) => state.deleteTicket);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyText, setReplyText] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customerId: '',
    priority: 'medium',
    status: 'open'
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const customer = customers.find(c => c.id === ticket.customerId);
      const matchesSearch = 
        ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [tickets, customers, searchTerm, statusFilter]);

  const ticketStats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    closed: tickets.filter(t => t.status === 'closed').length
  }), [tickets]);

  const handleOpenModal = () => {
    setFormData({
      subject: '',
      description: '',
      customerId: '',
      priority: 'medium',
      status: 'open'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addTicket(formData);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      deleteTicket(id);
    }
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (replyText.trim() && viewingTicket) {
      addTicketReply(viewingTicket.id, {
        message: replyText,
        isStaff: true,
        author: 'Staff'
      });
      setReplyText('');
      // Refresh viewing ticket
      const updatedTicket = tickets.find(t => t.id === viewingTicket.id);
      setViewingTicket(updatedTicket);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  const getStatusColor = (statusId) => {
    const status = ticketStatuses.find(s => s.id === statusId);
    return status?.color || '#64748b';
  };

  const getPriorityColor = (priorityId) => {
    const priority = ticketPriorities.find(p => p.id === priorityId);
    return priority?.color || '#64748b';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} />;
      case 'in-progress': return <Clock size={14} />;
      case 'answered': return <MessageCircle size={14} />;
      case 'closed': return <CheckCircle size={14} />;
      default: return <Ticket size={14} />;
    }
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Support Tickets</h1>
          <p>Manage customer support requests</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={18} />
            New Ticket
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon">
              <Ticket size={24} />
            </div>
            <div className="stat-value">{ticketStats.total}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <AlertCircle size={24} />
            </div>
            <div className="stat-value">{ticketStats.open}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info">
              <Clock size={24} />
            </div>
            <div className="stat-value">{ticketStats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="stat-value">{ticketStats.closed}</div>
            <div className="stat-label">Closed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters" style={{ marginBottom: '1rem' }}>
          {['all', 'open', 'in-progress', 'answered', 'closed'].map(status => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {tickets.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No support tickets"
            description="Create tickets to manage customer support requests"
            action={
              <button className="btn btn-primary" onClick={handleOpenModal}>
                <Plus size={18} />
                Create Ticket
              </button>
            }
          />
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Subject</th>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Last Update</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <strong style={{ color: 'var(--accent-primary)' }}>
                          {ticket.ticketNumber}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <strong>{ticket.subject}</strong>
                          {ticket.replies?.length > 0 && (
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '0.7rem', 
                              color: 'var(--text-muted)' 
                            }}>
                              ({ticket.replies.length} replies)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{getCustomerName(ticket.customerId)}</td>
                      <td>
                        <span 
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: `${getPriorityColor(ticket.priority)}20`,
                            color: getPriorityColor(ticket.priority),
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: `${getStatusColor(ticket.status)}20`,
                            color: getStatusColor(ticket.status)
                          }}
                        >
                          {getStatusIcon(ticket.status)}
                          {ticket.status}
                        </span>
                      </td>
                      <td>{format(new Date(ticket.updatedAt), 'MMM d, yyyy h:mm a')}</td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => setViewingTicket(ticket)}
                            title="View & Reply"
                          >
                            <MessageCircle size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(ticket.id)}
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

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Support Ticket"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief description of the issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select
                  className="form-select"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                >
                  <option value="">Select customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {ticketPriorities.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-textarea"
                placeholder="Detailed description of the issue..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
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
              Create Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* View Ticket Modal */}
      <Modal
        isOpen={!!viewingTicket}
        onClose={() => setViewingTicket(null)}
        title={`Ticket ${viewingTicket?.ticketNumber}`}
      >
        {viewingTicket && (
          <>
            <div className="modal-body">
              <div style={{ 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4>{viewingTicket.subject}</h4>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${getStatusColor(viewingTicket.status)}20`,
                      color: getStatusColor(viewingTicket.status)
                    }}
                  >
                    {viewingTicket.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Customer: {getCustomerName(viewingTicket.customerId)} • Priority: {viewingTicket.priority}
                </div>
                <p style={{ fontSize: '0.9rem' }}>{viewingTicket.description}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Created: {format(new Date(viewingTicket.createdAt), 'MMM d, yyyy h:mm a')}
                </div>
              </div>

              {/* Replies */}
              <div style={{ marginBottom: '1rem' }}>
                <h5 style={{ marginBottom: '0.75rem' }}>Conversation</h5>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {viewingTicket.replies?.length > 0 ? (
                    viewingTicket.replies.map(reply => (
                      <div 
                        key={reply.id}
                        style={{ 
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          borderRadius: 'var(--radius-md)',
                          background: reply.isStaff ? 'var(--accent-primary)10' : 'var(--bg-tertiary)',
                          borderLeft: `3px solid ${reply.isStaff ? 'var(--accent-primary)' : 'var(--border-color)'}`
                        }}
                      >
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-muted)',
                          marginBottom: '0.25rem'
                        }}>
                          <strong>{reply.author || (reply.isStaff ? 'Staff' : 'Customer')}</strong>
                          {' • '}
                          {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{reply.message}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      padding: '2rem', 
                      textAlign: 'center', 
                      color: 'var(--text-muted)',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      No replies yet
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {viewingTicket.status !== 'closed' && (
                <form onSubmit={handleReply}>
                  <div className="form-group">
                    <textarea
                      className="form-textarea"
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!replyText.trim()}>
                      <Send size={14} />
                      Send Reply
                    </button>
                  </div>
                </form>
              )}

              {/* Status Change */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label">Change Status</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {ticketStatuses.map(status => (
                    <button
                      key={status.id}
                      className={`btn btn-sm ${viewingTicket.status === status.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        updateTicket(viewingTicket.id, { status: status.id });
                        setViewingTicket({ ...viewingTicket, status: status.id });
                      }}
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setViewingTicket(null)}
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default Support;
