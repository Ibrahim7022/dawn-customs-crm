import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval, eachMonthOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Car,
  FileText,
  Receipt,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from 'lucide-react';

function Reports() {
  const jobs = useCrmStore((state) => state.jobs);
  const customers = useCrmStore((state) => state.customers);
  const invoices = useCrmStore((state) => state.invoices);
  const payments = useCrmStore((state) => state.payments);
  const expenses = useCrmStore((state) => state.expenses);
  const leads = useCrmStore((state) => state.leads);
  const services = useCrmStore((state) => state.services);
  const { format: formatCurrency } = useCurrency();

  const [dateRange, setDateRange] = useState('this-month');
  const [reportType, setReportType] = useState('overview');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'this-week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'this-year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'last-30-days':
        return { start: subDays(now, 30), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const range = getDateRange();

  // Filter data by date range
  const filterByDate = (items, dateField = 'createdAt') => {
    return items.filter(item => {
      const date = new Date(item[dateField] || item.createdAt);
      return isWithinInterval(date, { start: range.start, end: range.end });
    });
  };

  // Overview Stats
  const stats = useMemo(() => {
    const periodJobs = filterByDate(jobs);
    const periodCustomers = filterByDate(customers);
    const periodInvoices = filterByDate(invoices);
    const periodPayments = filterByDate(payments);
    const periodExpenses = filterByDate(expenses, 'date');
    const periodLeads = filterByDate(leads);

    const totalRevenue = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;

    const paidInvoices = periodInvoices.filter(i => i.status === 'paid');
    const pendingInvoices = periodInvoices.filter(i => i.status === 'sent' || i.status === 'overdue');
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

    const completedJobs = periodJobs.filter(j => j.status === 'delivered');
    const wonLeads = periodLeads.filter(l => l.status === 'won');
    const conversionRate = periodLeads.length > 0 ? (wonLeads.length / periodLeads.length * 100).toFixed(1) : 0;

    return {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0,
      jobsCount: periodJobs.length,
      completedJobs: completedJobs.length,
      newCustomers: periodCustomers.length,
      invoicesCount: periodInvoices.length,
      paidInvoices: paidInvoices.length,
      pendingAmount,
      leadsCount: periodLeads.length,
      wonLeads: wonLeads.length,
      conversionRate
    };
  }, [jobs, customers, invoices, payments, expenses, leads, range]);

  // Revenue by Month (for chart)
  const monthlyData = useMemo(() => {
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthPayments = payments.filter(p => {
        const date = new Date(p.createdAt);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date || e.createdAt);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      return {
        month: format(month, 'MMM'),
        revenue: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        expenses: monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      };
    });
  }, [payments, expenses]);

  // Services Report
  const servicesReport = useMemo(() => {
    const serviceStats = {};
    
    jobs.forEach(job => {
      job.services?.forEach(serviceId => {
        if (!serviceStats[serviceId]) {
          const service = services.find(s => s.id === serviceId);
          serviceStats[serviceId] = {
            name: service?.name || 'Unknown Service',
            count: 0,
            revenue: 0,
            price: service?.price || 0
          };
        }
        serviceStats[serviceId].count++;
        serviceStats[serviceId].revenue += serviceStats[serviceId].price;
      });
    });

    return Object.values(serviceStats).sort((a, b) => b.count - a.count);
  }, [jobs, services]);

  // Expense Categories Report
  const expensesByCategory = useMemo(() => {
    const periodExpenses = filterByDate(expenses, 'date');
    const byCategory = {};
    
    periodExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      if (!byCategory[cat]) {
        byCategory[cat] = { amount: 0, count: 0 };
      }
      byCategory[cat].amount += exp.amount || 0;
      byCategory[cat].count++;
    });

    return Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses, range]);

  // Customer Report
  const topCustomers = useMemo(() => {
    const customerStats = {};
    
    jobs.forEach(job => {
      if (job.customerId) {
        if (!customerStats[job.customerId]) {
          const customer = customers.find(c => c.id === job.customerId);
          customerStats[job.customerId] = {
            name: customer?.name || 'Unknown',
            jobCount: 0,
            totalSpent: 0
          };
        }
        customerStats[job.customerId].jobCount++;
        customerStats[job.customerId].totalSpent += job.totalPrice || 0;
      }
    });

    return Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
  }, [jobs, customers]);

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Reports</h1>
          <p>Analytics and insights for your business</p>
        </div>
        <div className="header-actions">
          <select
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="this-year">This Year</option>
          </select>
        </div>
      </header>

      <div className="page-content">
        {/* Report Type Tabs */}
        <div className="filters" style={{ marginBottom: '1.5rem' }}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'services', label: 'Services', icon: Car },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'expenses', label: 'Expenses', icon: Receipt }
          ].map(tab => (
            <button
              key={tab.id}
              className={`filter-btn ${reportType === tab.id ? 'active' : ''}`}
              onClick={() => setReportType(tab.id)}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Report */}
        {reportType === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-icon success">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon error">
                  <TrendingDown size={24} />
                </div>
                <div className="stat-value">{formatCurrency(stats.totalExpenses)}</div>
                <div className="stat-label">Total Expenses</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: stats.profit >= 0 ? 'var(--success)20' : 'var(--error)20' }}>
                  <DollarSign size={24} style={{ color: stats.profit >= 0 ? 'var(--success)' : 'var(--error)' }} />
                </div>
                <div className="stat-value" style={{ color: stats.profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  {formatCurrency(stats.profit)}
                </div>
                <div className="stat-label">Net Profit ({stats.profitMargin}%)</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning">
                  <FileText size={24} />
                </div>
                <div className="stat-value">{formatCurrency(stats.pendingAmount)}</div>
                <div className="stat-label">Pending Invoices</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Jobs & Customers */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Business Activity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ 
                    padding: '1rem', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {stats.jobsCount}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Jobs ({stats.completedJobs} completed)
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1rem', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {stats.newCustomers}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      New Customers
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1rem', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {stats.leadsCount}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Leads ({stats.conversionRate}% converted)
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1rem', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {stats.invoicesCount}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Invoices ({stats.paidInvoices} paid)
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Monthly Revenue (This Year)</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px' }}>
                  {monthlyData.map((data, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '100%',
                          height: `${Math.max((data.revenue / maxRevenue) * 150, 4)}px`,
                          background: 'var(--accent-primary)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }}
                        title={`${data.month}: ${formatCurrency(data.revenue)}`}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {data.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Revenue Report */}
        {reportType === 'revenue' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Revenue Details</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: 'right' }}>Revenue</th>
                    <th style={{ textAlign: 'right' }}>Expenses</th>
                    <th style={{ textAlign: 'right' }}>Profit</th>
                    <th style={{ textAlign: 'right' }}>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, idx) => {
                    const profit = data.revenue - data.expenses;
                    const margin = data.revenue > 0 ? ((profit / data.revenue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx}>
                        <td>{data.month}</td>
                        <td style={{ textAlign: 'right', color: 'var(--success)' }}>
                          {formatCurrency(data.revenue)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--error)' }}>
                          {formatCurrency(data.expenses)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                          {formatCurrency(profit)}
                        </td>
                        <td style={{ textAlign: 'right' }}>{margin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: '700', borderTop: '2px solid var(--border-color)' }}>
                    <td>Total</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>
                      {formatCurrency(monthlyData.reduce((sum, d) => sum + d.revenue, 0))}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--error)' }}>
                      {formatCurrency(monthlyData.reduce((sum, d) => sum + d.expenses, 0))}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(monthlyData.reduce((sum, d) => sum + (d.revenue - d.expenses), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Services Report */}
        {reportType === 'services' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Services Performance</h3>
            {servicesReport.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th style={{ textAlign: 'center' }}>Times Used</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesReport.map((service, idx) => (
                      <tr key={idx}>
                        <td>{service.name}</td>
                        <td style={{ textAlign: 'center' }}>{service.count}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(service.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success)' }}>
                          {formatCurrency(service.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No service data available
              </div>
            )}
          </div>
        )}

        {/* Customers Report */}
        {reportType === 'customers' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Top Customers</h3>
            {topCustomers.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Customer</th>
                      <th style={{ textAlign: 'center' }}>Jobs</th>
                      <th style={{ textAlign: 'right' }}>Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{customer.name}</td>
                        <td style={{ textAlign: 'center' }}>{customer.jobCount}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent-primary)' }}>
                          {formatCurrency(customer.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No customer data available
              </div>
            )}
          </div>
        )}

        {/* Expenses Report */}
        {reportType === 'expenses' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Expenses by Category</h3>
            {expensesByCategory.length > 0 ? (
              <>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {expensesByCategory.map((cat, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        padding: '1rem 1.5rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        minWidth: '150px'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {cat.category}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--error)' }}>
                        {formatCurrency(cat.amount)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {cat.count} transactions
                      </div>
                    </div>
                  ))}
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th style={{ textAlign: 'center' }}>Transactions</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th style={{ textAlign: 'right' }}>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesByCategory.map((cat, idx) => {
                        const total = expensesByCategory.reduce((sum, c) => sum + c.amount, 0);
                        const percentage = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={idx}>
                            <td>{cat.category}</td>
                            <td style={{ textAlign: 'center' }}>{cat.count}</td>
                            <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--error)' }}>
                              {formatCurrency(cat.amount)}
                            </td>
                            <td style={{ textAlign: 'right' }}>{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No expense data available for this period
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Reports;
