import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800"></div>
    </div>
  );

  if (!user) {
    // Save QR URL if present so we can redirect after login
    if (window.location.search.includes('token=')) {
      sessionStorage.setItem('pendingQR', window.location.href);
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return user.role === 'student'
      ? <Navigate to="/student/dashboard" replace />
      : <Navigate to="/faculty/dashboard" replace />;
  }

  return <Outlet />;
}