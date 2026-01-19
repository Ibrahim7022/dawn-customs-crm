import { Navigate } from 'react-router-dom';
import { useCrmStore } from '../store/crmStore';

function ProtectedRoute({ children, requiredRole = null }) {
  const currentUser = useCrmStore((state) => state.currentUser);

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
