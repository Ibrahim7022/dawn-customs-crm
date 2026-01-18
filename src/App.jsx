import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Customers from './pages/Customers';
import Services from './pages/Services';
import Leads from './pages/Leads';
import Invoices from './pages/Invoices';
import Estimates from './pages/Estimates';
import Expenses from './pages/Expenses';
import Tasks from './pages/Tasks';
import Support from './pages/Support';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="customers" element={<Customers />} />
          <Route path="leads" element={<Leads />} />
          <Route path="services" element={<Services />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="estimates" element={<Estimates />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="support" element={<Support />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
