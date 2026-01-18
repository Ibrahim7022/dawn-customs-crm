import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import Modal from '../components/Modal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Car,
  FileText,
  CheckSquare,
  Edit2,
  Trash2
} from 'lucide-react';

function Calendar() {
  const jobs = useCrmStore((state) => state.jobs);
  const tasks = useCrmStore((state) => state.tasks);
  const invoices = useCrmStore((state) => state.invoices);
  const estimates = useCrmStore((state) => state.estimates);
  const events = useCrmStore((state) => state.events);
  const addEvent = useCrmStore((state) => state.addEvent);
  const updateEvent = useCrmStore((state) => state.updateEvent);
  const deleteEvent = useCrmStore((state) => state.deleteEvent);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState({
    jobs: true,
    tasks: true,
    invoices: true,
    estimates: true,
    events: true
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    type: 'event',
    color: '#6366f1'
  });

  const eventColors = {
    job: '#f59e0b',
    task: '#3b82f6',
    invoice: '#22c55e',
    estimate: '#8b5cf6',
    event: '#6366f1'
  };

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Combine all events
  const allEvents = useMemo(() => {
    const combined = [];

    // Jobs (by expected completion date or created date)
    if (showFilters.jobs) {
      jobs.forEach(job => {
        if (job.expectedDate) {
          combined.push({
            id: job.id,
            title: `${job.vehicleMake} ${job.vehicleModel}`,
            date: job.expectedDate,
            type: 'job',
            color: eventColors.job,
            data: job
          });
        }
      });
    }

    // Tasks (by due date)
    if (showFilters.tasks) {
      tasks.filter(t => t.dueDate && t.status !== 'completed').forEach(task => {
        combined.push({
          id: task.id,
          title: task.title,
          date: task.dueDate,
          type: 'task',
          color: eventColors.task,
          data: task
        });
      });
    }

    // Invoices (by due date)
    if (showFilters.invoices) {
      invoices.filter(i => i.dueDate && i.status !== 'paid').forEach(invoice => {
        combined.push({
          id: invoice.id,
          title: `Invoice ${invoice.invoiceNumber}`,
          date: invoice.dueDate,
          type: 'invoice',
          color: eventColors.invoice,
          data: invoice
        });
      });
    }

    // Estimates (by valid until date)
    if (showFilters.estimates) {
      estimates.filter(e => e.validUntil && e.status !== 'accepted').forEach(estimate => {
        combined.push({
          id: estimate.id,
          title: `Quote ${estimate.estimateNumber}`,
          date: estimate.validUntil,
          type: 'estimate',
          color: eventColors.estimate,
          data: estimate
        });
      });
    }

    // Custom events
    if (showFilters.events) {
      events.forEach(event => {
        combined.push({
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          type: 'event',
          color: event.color || eventColors.event,
          data: event
        });
      });
    }

    return combined;
  }, [jobs, tasks, invoices, estimates, events, showFilters]);

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return allEvents.filter(event => isSameDay(new Date(event.date), day));
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleOpenModal = (date = null) => {
    setFormData({
      title: '',
      description: '',
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      time: '',
      type: 'event',
      color: '#6366f1'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addEvent(formData);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Delete this event?')) {
      deleteEvent(eventId);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'job': return <Car size={12} />;
      case 'task': return <CheckSquare size={12} />;
      case 'invoice': return <FileText size={12} />;
      case 'estimate': return <FileText size={12} />;
      default: return <CalendarIcon size={12} />;
    }
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Calendar</h1>
          <p>View all your events, deadlines, and schedules</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Event
          </button>
        </div>
      </header>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
          {/* Calendar Grid */}
          <div className="card" style={{ padding: '1.5rem' }}>
            {/* Calendar Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-ghost btn-icon" onClick={handlePrevMonth}>
                  <ChevronLeft size={20} />
                </button>
                <h2 style={{ margin: 0, minWidth: '200px', textAlign: 'center' }}>
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <button className="btn btn-ghost btn-icon" onClick={handleNextMonth}>
                  <ChevronRight size={20} />
                </button>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleToday}>
                Today
              </button>
            </div>

            {/* Week Headers */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              marginBottom: '0.5rem'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div 
                  key={day}
                  style={{ 
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px'
            }}>
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      minHeight: '80px',
                      padding: '0.5rem',
                      background: isSelected ? 'var(--accent-primary)15' : 
                                 isToday(day) ? 'var(--bg-tertiary)' : 'transparent',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      opacity: isCurrentMonth ? 1 : 0.4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ 
                        fontWeight: isToday(day) ? '700' : '500',
                        color: isToday(day) ? 'var(--accent-primary)' : 'inherit',
                        fontSize: '0.85rem'
                      }}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <span style={{ 
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)'
                        }}>
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: '0.65rem',
                            padding: '2px 4px',
                            borderRadius: '2px',
                            background: `${event.color}20`,
                            color: event.color,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          {getEventIcon(event.type)}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Filters */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Show</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { key: 'jobs', label: 'Jobs', color: eventColors.job },
                  { key: 'tasks', label: 'Tasks', color: eventColors.task },
                  { key: 'invoices', label: 'Invoices', color: eventColors.invoice },
                  { key: 'estimates', label: 'Estimates', color: eventColors.estimate },
                  { key: 'events', label: 'Events', color: eventColors.event }
                ].map(filter => (
                  <label 
                    key={filter.key}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showFilters[filter.key]}
                      onChange={(e) => setShowFilters({ ...showFilters, [filter.key]: e.target.checked })}
                    />
                    <span 
                      style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        background: filter.color 
                      }} 
                    />
                    {filter.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Selected Day Events */}
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <h4 style={{ fontSize: '0.9rem', margin: 0 }}>
                  {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a day'}
                </h4>
                {selectedDate && (
                  <button 
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleOpenModal(selectedDate)}
                    title="Add event"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {selectedDate ? (
                selectedDayEvents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedDayEvents.map(event => (
                      <div
                        key={`${event.type}-${event.id}`}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-tertiary)',
                          borderLeft: `3px solid ${event.color}`
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              marginBottom: '0.25rem'
                            }}>
                              {getEventIcon(event.type)}
                              <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                                {event.title}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              {event.time && ` • ${event.time}`}
                            </div>
                          </div>
                          {event.type === 'event' && (
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => handleDeleteEvent(event.id)}
                              style={{ color: 'var(--error)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}>
                    No events on this day
                  </div>
                )
              ) : (
                <div style={{ 
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  Click on a day to see events
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Event"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Event name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: color,
                      border: formData.color === color ? '3px solid white' : 'none',
                      boxShadow: formData.color === color ? `0 0 0 2px ${color}` : 'none',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Event details..."
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
              Add Event
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Calendar;
