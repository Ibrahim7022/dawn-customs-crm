import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCrmStore } from '../store/crmStore';
import {
  LayoutDashboard,
  Car,
  Users,
  Wrench,
  Settings,
  Zap,
  UserPlus,
  FileText,
  Calculator,
  Receipt,
  CheckSquare,
  MessageSquare,
  Calendar,
  BarChart3,
  ChevronDown,
  LogOut,
  Shield,
  User
} from 'lucide-react';
import { useState } from 'react';

function Layout() {
  const navigate = useNavigate();
  const settings = useCrmStore((state) => state.settings);
  const currentUser = useCrmStore((state) => state.currentUser);
  const logout = useCrmStore((state) => state.logout);
  const jobs = useCrmStore((state) => state.jobs);
  const leads = useCrmStore((state) => state.leads);
  const tasks = useCrmStore((state) => state.tasks);
  const tickets = useCrmStore((state) => state.tickets);
  
  const activeJobs = jobs.filter(j => !['delivered'].includes(j.status)).length;
  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.status)).length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

  const [salesOpen, setSalesOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Zap />
            <span><span style={{ color: 'var(--accent-primary)' }}>Dawn</span>Customs</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Main Menu</span>
            
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Car size={18} />
              <span>Jobs</span>
              {activeJobs > 0 && <span className="nav-badge">{activeJobs}</span>}
            </NavLink>

            <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customers</span>
            </NavLink>

            <NavLink to="/leads" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <UserPlus size={18} />
              <span>Leads</span>
              {activeLeads > 0 && <span className="nav-badge">{activeLeads}</span>}
            </NavLink>

            <NavLink to="/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Wrench size={18} />
              <span>Services</span>
            </NavLink>
          </div>

          {/* Sales & Finance - Admin only */}
          {isAdmin && (
            <div className="nav-section">
              <span className="nav-section-title">Sales & Finance</span>

              <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FileText size={18} />
                <span>Invoices</span>
              </NavLink>

              <NavLink to="/estimates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Calculator size={18} />
                <span>Estimates</span>
              </NavLink>

              <NavLink to="/expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Receipt size={18} />
                <span>Expenses</span>
              </NavLink>
            </div>
          )}

          {/* Productivity - Admin only */}
          {isAdmin && (
            <div className="nav-section">
              <span className="nav-section-title">Productivity</span>

              <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <CheckSquare size={18} />
                <span>Tasks</span>
                {pendingTasks > 0 && <span className="nav-badge">{pendingTasks}</span>}
              </NavLink>

              <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Calendar size={18} />
                <span>Calendar</span>
              </NavLink>

              <NavLink to="/support" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <MessageSquare size={18} />
                <span>Support</span>
                {openTickets > 0 && <span className="nav-badge">{openTickets}</span>}
              </NavLink>
            </div>
          )}

          {/* Admin - Admin only */}
          {isAdmin && (
            <div className="nav-section">
              <span className="nav-section-title">Admin</span>

              <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BarChart3 size={18} />
                <span>Reports</span>
              </NavLink>

              <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)'
          }}>
            {/* User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: currentUser?.role === 'admin' ? 'var(--accent-primary)20' : 'var(--info)20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentUser?.role === 'admin' ? 'var(--accent-primary)' : 'var(--info)'
              }}>
                {currentUser?.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {currentUser?.name || 'User'}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'capitalize'
                }}>
                  {currentUser?.role || 'user'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'var(--error)20';
                e.target.style.borderColor = 'var(--error)';
                e.target.style.color = 'var(--error)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut size={16} />
              Logout
            </button>

            {/* Version Info */}
            <div style={{
              marginTop: '0.75rem',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              {settings.businessName} CRM v2.0
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
