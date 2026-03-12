import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          const res = await getMe();
          const meData = res.data.data;
          const freshUser = meData.user || meData.faculty || meData.student;
          if (freshUser) {
            const u = { ...freshUser, role: freshUser.role };
            setUser(u);
            setToken(savedToken);
            localStorage.setItem('user', JSON.stringify(u));
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (tok, userData) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const isAdmin   = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isStudent, isFaculty, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;