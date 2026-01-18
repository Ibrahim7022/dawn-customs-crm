import { NavLink, Outlet } from 'react-router-dom';
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
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

function Layout() {
  const settings = useCrmStore((state) => state.settings);
  const jobs = useCrmStore((state) => state.jobs);
  const leads = useCrmStore((state) => state.leads);
  const tasks = useCrmStore((state) => state.tasks);
  const tickets = useCrmStore((state) => state.tickets);
  
  const activeJobs = jobs.filter(j => !['delivered'].includes(j.status)).length;
  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.status)).length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

  const [salesOpen, setSalesOpen] = useState(false);

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
        </nav>

        <div className="sidebar-footer">
          {settings.businessName} CRM v2.0
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
