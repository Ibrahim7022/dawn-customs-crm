import { useNavigate } from 'react-router-dom';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import {
  Car,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const jobs = useCrmStore((state) => state.jobs);
  const customers = useCrmStore((state) => state.customers);
  const statuses = useCrmStore((state) => state.statuses);
  const getStats = useCrmStore((state) => state.getStats);
  const { format: formatCurrency } = useCurrency();
  
  const stats = getStats();
  
  const activeJobs = jobs
    .filter(j => !['delivered'].includes(j.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const recentCustomers = customers
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getStatusProgress = (statusId) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return 0;
    return (status.order / statuses.length) * 100;
  };

  const urgentJobs = jobs.filter(j => {
    if (['delivered', 'ready'].includes(j.status)) return false;
    const daysSinceUpdate = (Date.now() - new Date(j.updatedAt)) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 3;
  });

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening today.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
            <Car size={18} />
            New Job
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="stat-icon primary">
              <Car size={24} />
            </div>
            <div className="stat-value">{stats.activeJobs}</div>
            <div className="stat-label">Active Jobs</div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              In progress now
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="stat-icon success">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-value">{stats.completedThisMonth}</div>
            <div className="stat-label">Completed This Month</div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              Great progress!
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="stat-icon warning">
              <Users size={24} />
            </div>
            <div className="stat-value">{stats.totalCustomers}</div>
            <div className="stat-label">Total Customers</div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="stat-icon info">
              <DollarSign size={24} />
            </div>
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              {formatCurrency(stats.monthlyRevenue)} this month
            </div>
          </div>
        </div>

        {/* Urgent Jobs Alert */}
        {urgentJobs.length > 0 && (
          <div className="card animate-fade-in" style={{ 
            marginBottom: '1.5rem', 
            borderColor: 'var(--warning)',
            background: 'rgba(245, 158, 11, 0.05)'
          }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertCircle size={24} style={{ color: 'var(--warning)' }} />
              <div>
                <strong>{urgentJobs.length} job(s)</strong> haven't been updated in over 3 days
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  - Please review and update their status
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid-2">
          {/* Active Jobs */}
          <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="card-header">
              <h3>Active Jobs</h3>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/jobs')}
              >
                View All <ArrowRight size={16} />
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {activeJobs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active jobs. Start by adding a new job!
                </div>
              ) : (
                <div>
                  {activeJobs.map((job) => (
                    <div 
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div className="vehicle-info">
                          <div className="vehicle-avatar">
                            <Car size={18} />
                          </div>
                          <div className="vehicle-details">
                            <h4>{job.vehicleMake} {job.vehicleModel}</h4>
                            <p>{job.vehicleYear} • {job.licensePlate}</p>
                          </div>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${getStatusProgress(job.status)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Customers */}
          <div className="card animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="card-header">
              <h3>Recent Customers</h3>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/customers')}
              >
                View All <ArrowRight size={16} />
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {recentCustomers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No customers yet. Add your first customer!
                </div>
              ) : (
                <div>
                  {recentCustomers.map((customer) => (
                    <div 
                      key={customer.id}
                      style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div className="customer-info">
                        <div className="customer-avatar">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="customer-name">{customer.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {format(new Date(customer.createdAt), 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Status Overview */}
        <div className="card animate-fade-in" style={{ marginTop: '1.5rem', animationDelay: '300ms' }}>
          <div className="card-header">
            <h3>Jobs by Status</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {statuses.map((status) => {
                const count = jobs.filter(j => j.status === status.id).length;
                return (
                  <div 
                    key={status.id}
                    style={{
                      flex: '1 1 150px',
                      padding: '1rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${status.color}`,
                      cursor: 'pointer',
                      transition: 'transform var(--transition-fast)'
                    }}
                    onClick={() => navigate('/jobs')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700',
                      color: status.color 
                    }}>
                      {count}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)'
                    }}>
                      {status.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
