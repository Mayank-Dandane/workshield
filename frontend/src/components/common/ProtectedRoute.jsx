import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800"></div>
    </div>
  );

  if (!user) {
    // ── Save the full URL they were trying to reach ──────────
    // e.g. /student/scan?token=xxx&workshop=yyy
    // After login, StudentLogin will redirect back here
    const loginPage = allowedRoles?.includes('student') ? '/login' : '/faculty/login';
    return <Navigate to={loginPage} state={{ from: location.pathname + location.search }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role — redirect to their own dashboard
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'super_admin') return <Navigate to="/hod" replace />;
    return <Navigate to="/faculty/dashboard" replace />;
  }

  return <Outlet />;
}