import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import StudentLogin from './pages/auth/StudentLogin';
import FacultyLogin from './pages/faculty/FacultyLogin';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import ScanQR from './pages/student/ScanQR';
import MyAttendance from './pages/student/MyAttendance';
import Feedback from './pages/student/Feedback';
import MyCertificates from './pages/student/MyCertificates';

// Faculty pages
import FacultyDashboard from './pages/faculty/Dashboard';
import CreateWorkshop from './pages/faculty/CreateWorkshop';
import LiveSession from './pages/faculty/LiveSession';
import Reports from './pages/faculty/Reports';
import Analytics from './pages/faculty/Analytics';

// Public
import VerifyCertificate from './pages/VerifyCertificate';

// Protected route wrapper
import ProtectedRoute from './components/common/ProtectedRoute';

// ── Move RootRedirect BEFORE router definition ─────────────────
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/faculty/dashboard" replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <StudentLogin /> },
  { path: '/faculty/login', element: <FacultyLogin /> },
  { path: '/verify/:certificateId', element: <VerifyCertificate /> },

  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'scan', element: <ScanQR /> },
      { path: 'attendance', element: <MyAttendance /> },
      { path: 'feedback', element: <Feedback /> },
      { path: 'certificates', element: <MyCertificates /> },
    ]
  },

  {
    path: '/faculty',
    element: <ProtectedRoute allowedRoles={['faculty', 'super_admin']} />,
    children: [
      { path: 'dashboard', element: <FacultyDashboard /> },
      { path: 'create-workshop', element: <CreateWorkshop /> },
      { path: 'live/:workshopId', element: <LiveSession /> },
      { path: 'reports', element: <Reports /> },
      { path: 'analytics/:workshopId', element: <Analytics /> },
    ]
  },

  { path: '*', element: <Navigate to="/" replace /> }
]);