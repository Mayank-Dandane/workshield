import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Load user from localStorage on app start ───────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Set saved user immediately so UI doesn't flash
          setUser(JSON.parse(savedUser));

          // Verify token is still valid
          const res = await getMe();
          const meData = res.data.data;
          const freshUser = meData.user || meData.faculty || meData.student;

          if (freshUser) {
            setUser({ ...freshUser, role: freshUser.role });
            localStorage.setItem('user', JSON.stringify({ ...freshUser, role: freshUser.role }));
          }
        } catch (err) {
          // Token invalid — clear storage
          console.error('Auth verification failed:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // ── Login ──────────────────────────────────────────────────
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // ── Role checks ────────────────────────────────────────────
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isStudent,
      isFaculty,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom hook ────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;