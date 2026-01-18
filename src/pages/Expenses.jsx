import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Plus,
  Search,
  Receipt,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter
} from 'lucide-react';

function Expenses() {
  const expenses = useCrmStore((state) => state.expenses);
  const expenseCategories = useCrmStore((state) => state.expenseCategories);
  const customers = useCrmStore((state) => state.customers);
  const addExpense = useCrmStore((state) => state.addExpense);
  const updateExpense = useCrmStore((state) => state.updateExpense);
  const deleteExpense = useCrmStore((state) => state.deleteExpense);
  const { format: formatCurrency } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this-month');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    reference: '',
    notes: '',
    billable: false,
    customerId: ''
  });

  const paymentMethods = ['cash', 'upi', 'card', 'bank_transfer', 'cheque'];

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'this-year':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default:
        return null;
    }
  };

  const filteredExpenses = useMemo(() => {
    const range = getDateRange();
    
    return expenses.filter(exp => {
      const matchesSearch = 
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
      
      let matchesDate = true;
      if (range) {
        const expDate = new Date(exp.date || exp.createdAt);
        matchesDate = isWithinInterval(expDate, { start: range.start, end: range.end });
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [expenses, searchTerm, categoryFilter, dateRange]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [filteredExpenses]);

  const expensesByCategory = useMemo(() => {
    const byCategory = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + (exp.amount || 0);
    });
    return byCategory;
  }, [filteredExpenses]);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        category: expense.category || '',
        date: expense.date || format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: expense.paymentMethod || 'cash',
        reference: expense.reference || '',
        notes: expense.notes || '',
        billable: expense.billable || false,
        customerId: expense.customerId || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        reference: '',
        notes: '',
        billable: false,
        customerId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = expenseCategories.find(c => c.id === categoryId);
    return cat?.name || categoryId || 'Uncategorized';
  };

  const getCategoryColor = (categoryId) => {
    const cat = expenseCategories.find(c => c.id === categoryId);
    return cat?.color || '#64748b';
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Expenses</h1>
          <p>Track and manage your business expenses</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Expense
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Stats Cards */}
        <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon error">
              <TrendingDown size={24} />
            </div>
            <div className="stat-value">{formatCurrency(totalExpenses)}</div>
            <div className="stat-label">Total Expenses</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon warning">
              <Receipt size={24} />
            </div>
            <div className="stat-value">{filteredExpenses.length}</div>
            <div className="stat-label">Transactions</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon info">
              <Calendar size={24} />
            </div>
            <div className="stat-value">{formatCurrency(totalExpenses / (filteredExpenses.length || 1))}</div>
            <div className="stat-label">Average Expense</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="form-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="all">All Time</option>
            </select>
            
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Categories</option>
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(expensesByCategory).length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Breakdown by Category</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {Object.entries(expensesByCategory).map(([cat, amount]) => (
                <div 
                  key={cat}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `3px solid ${getCategoryColor(cat)}`
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{getCategoryName(cat)}</span>
                  <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded"
            description="Start tracking your business expenses"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add First Expense
              </button>
            }
          />
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{format(new Date(expense.date || expense.createdAt), 'MMM d, yyyy')}</td>
                      <td>
                        <div>
                          <strong>{expense.description}</strong>
                          {expense.reference && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Ref: {expense.reference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span 
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: `${getCategoryColor(expense.category)}20`,
                            color: getCategoryColor(expense.category),
                            fontSize: '0.75rem'
                          }}
                        >
                          {getCategoryName(expense.category)}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {expense.paymentMethod?.replace('_', ' ')}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--error)' }}>
                        {formatCurrency(expense.amount || 0)}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleOpenModal(expense)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(expense.id)}
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

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Description *</label>
              <input
                type="text"
                className="form-input"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>
                      {method.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reference Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Bill/Receipt number"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.billable}
                  onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                />
                <span>Billable to customer</span>
              </label>
            </div>

            {formData.billable && (
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
            )}

            <div className="form-group">
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
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Expenses;
