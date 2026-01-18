import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format, isPast, isToday, addDays } from 'date-fns';
import {
  Plus,
  Search,
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Calendar,
  Edit2,
  Trash2,
  Flag,
  MoreVertical,
  CheckCircle2,
  Circle
} from 'lucide-react';

function Tasks() {
  const tasks = useCrmStore((state) => state.tasks);
  const customers = useCrmStore((state) => state.customers);
  const jobs = useCrmStore((state) => state.jobs);
  const addTask = useCrmStore((state) => state.addTask);
  const updateTask = useCrmStore((state) => state.updateTask);
  const deleteTask = useCrmStore((state) => state.deleteTask);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    status: 'pending',
    relatedTo: '',
    relatedType: '',
    assignee: ''
  });

  const priorities = [
    { id: 'low', name: 'Low', color: '#64748b' },
    { id: 'medium', name: 'Medium', color: '#f59e0b' },
    { id: 'high', name: 'High', color: '#ef4444' },
    { id: 'urgent', name: 'Urgent', color: '#dc2626' }
  ];

  const statuses = [
    { id: 'pending', name: 'Pending', color: '#64748b' },
    { id: 'in-progress', name: 'In Progress', color: '#3b82f6' },
    { id: 'completed', name: 'Completed', color: '#22c55e' },
    { id: 'cancelled', name: 'Cancelled', color: '#6b7280' }
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      // Sort by status (completed last), then by due date
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status !== 'completed' && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length
  }), [tasks]);

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        status: task.status || 'pending',
        relatedTo: task.relatedTo || '',
        relatedType: task.relatedType || '',
        assignee: task.assignee || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        status: 'pending',
        relatedTo: '',
        relatedType: '',
        assignee: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask(formData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask(task.id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null
    });
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.id === priority)?.color || '#64748b';
  };

  const getStatusColor = (status) => {
    return statuses.find(s => s.id === status)?.color || '#64748b';
  };

  const isOverdue = (task) => {
    return task.status !== 'completed' && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Tasks</h1>
          <p>Manage and track your team's tasks</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon">
              <CheckSquare size={24} />
            </div>
            <div className="stat-value">{taskStats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <Clock size={24} />
            </div>
            <div className="stat-value">{taskStats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info">
              <Circle size={24} />
            </div>
            <div className="stat-value">{taskStats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-value">{taskStats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          {taskStats.overdue > 0 && (
            <div className="stat-card">
              <div className="stat-icon error">
                <AlertTriangle size={24} />
              </div>
              <div className="stat-value" style={{ color: 'var(--error)' }}>{taskStats.overdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="filters" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'in-progress', 'completed'].map(status => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
            
            <div style={{ borderLeft: '1px solid var(--border-color)', marginLeft: '0.5rem', paddingLeft: '0.5rem' }}>
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.5rem' }}
              >
                <option value="all">All Priorities</option>
                {priorities.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Create tasks to organize your work"
            action={
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Create First Task
              </button>
            }
          />
        ) : (
          <div className="card">
            <div className="task-list">
              {filteredTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-item ${task.status === 'completed' ? 'completed' : ''} ${isOverdue(task) ? 'overdue' : ''}`}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    background: task.status === 'completed' ? 'var(--bg-tertiary)' : 'transparent',
                    opacity: task.status === 'completed' ? 0.7 : 1
                  }}
                >
                  <button
                    onClick={() => handleToggleComplete(task)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      color: task.status === 'completed' ? 'var(--success)' : 'var(--text-muted)',
                      padding: '0.25rem'
                    }}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ 
                        fontWeight: '500',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </span>
                      <span 
                        style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: `${getPriorityColor(task.priority)}20`,
                          color: getPriorityColor(task.priority),
                          fontSize: '0.7rem',
                          fontWeight: '500'
                        }}
                      >
                        <Flag size={10} />
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)',
                        margin: '0.25rem 0'
                      }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      {task.dueDate && (
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          color: isOverdue(task) ? 'var(--error)' : isToday(new Date(task.dueDate)) ? 'var(--warning)' : 'inherit'
                        }}>
                          <Calendar size={12} />
                          {isToday(new Date(task.dueDate)) ? 'Today' : format(new Date(task.dueDate), 'MMM d, yyyy')}
                          {isOverdue(task) && <AlertTriangle size={12} />}
                        </span>
                      )}
                      
                      <span 
                        style={{ 
                          padding: '0.125rem 0.375rem',
                          borderRadius: 'var(--radius-sm)',
                          background: `${getStatusColor(task.status)}20`,
                          color: getStatusColor(task.status),
                          fontSize: '0.7rem'
                        }}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleOpenModal(task)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleDelete(task.id)}
                      style={{ color: 'var(--error)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Add more details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {priorities.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
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
                  {statuses.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Related To</label>
                <select
                  className="form-select"
                  value={formData.relatedType}
                  onChange={(e) => setFormData({ ...formData, relatedType: e.target.value, relatedTo: '' })}
                >
                  <option value="">Not linked</option>
                  <option value="customer">Customer</option>
                  <option value="job">Job</option>
                </select>
              </div>
              {formData.relatedType && (
                <div className="form-group">
                  <label className="form-label">
                    {formData.relatedType === 'customer' ? 'Customer' : 'Job'}
                  </label>
                  <select
                    className="form-select"
                    value={formData.relatedTo}
                    onChange={(e) => setFormData({ ...formData, relatedTo: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {formData.relatedType === 'customer' && customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {formData.relatedType === 'job' && jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.vehicleMake} {j.vehicleModel} - {j.licensePlate}</option>
                    ))}
                  </select>
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
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Tasks;
