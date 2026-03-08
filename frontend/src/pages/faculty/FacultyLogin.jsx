import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyLogin } from '../../api/auth.api';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function FacultyLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await facultyLogin(form);
      const { token, user } = res.data.data;  // ← 'user' not 'faculty'
      login(token, user);                      // ← correct order
      toast.success(`Welcome, ${user.name}!`);
      navigate('/faculty/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 to-blue-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-lg">WorkShield</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Faculty Portal
          </h1>
          <p className="text-indigo-200 mt-4 text-lg leading-relaxed">
            Manage workshops, track attendance, and generate reports — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {[
              '📊 Real-time attendance tracking',
              '📱 Rotating QR code system',
              '📄 Auto-generate PDF reports',
              '🏆 Digital certificate issuance'
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-indigo-100 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0"></div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-xs">
          © 2026 WorkShield — JSPM's RSCOE | Dept. of Automation & Robotics
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-800 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">WorkShield</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">Faculty Sign In</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="priya@jspmrscoe.edu.in"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                : 'Sign In'
              }
            </button>

            <p className="text-center text-sm text-slate-500">
              Student?{' '}
              <a href="/login" className="text-indigo-700 font-medium hover:underline">
                Login here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}