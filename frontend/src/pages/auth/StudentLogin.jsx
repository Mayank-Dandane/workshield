import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentLogin } from '../../api/auth.api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

export default function StudentLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('email'); // 'email' | 'roll'
  const [form, setForm] = useState({ email: '', password: '', roll_number: '', dob: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Where to go after login ──────────────────────────────────
  // If student was redirected from a scan URL, go back there
  const from = location.state?.from || '/student/dashboard';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = tab === 'email'
        ? { email: form.email, password: form.password }
        : { roll_number: form.roll_number, dob: form.dob };

      const res = await studentLogin(payload);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome, ${user.name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Student Login</h1>
          <p className="text-slate-500 text-sm mt-1">WorkShield — JSPM's RSCOE</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
          {['email', 'roll'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              {t === 'email' ? 'Email & Password' : 'Roll No & DOB'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          {tab === 'email' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">College Email</label>
                <input type="email" placeholder="you@jspmrscoe.edu.in" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Roll Number / PRN</label>
                <input type="text" placeholder="e.g. RBT24AR001" value={form.roll_number}
                  onChange={e => set('roll_number', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                <input type="date" value={form.dob}
                  onChange={e => set('dob', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {loading && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Faculty?{' '}
          <a href="/faculty/login" className="text-blue-700 font-medium hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}