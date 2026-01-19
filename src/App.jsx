import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useCrmStore } from './store/crmStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
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
import PublicEstimate from './pages/PublicEstimate';

function AppRoutes() {
  const currentUser = useCrmStore((state) => state.currentUser);

  return (
    <Routes>
      {/* Public routes (no layout, no auth) */}
      <Route path="/estimate/:token" element={<PublicEstimate />} />
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" replace /> : <Login />} 
      />
      
      {/* Protected routes (with layout) */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
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
        <Route 
          path="reports" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="settings" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Settings />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Catch all - redirect to login or dashboard */}
      <Route 
        path="*" 
        element={<Navigate to={currentUser ? "/" : "/login"} replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
