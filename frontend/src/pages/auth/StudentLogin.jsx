import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentLogin } from '../../api/auth.api';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [domainWarning, setDomainWarning] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'email') {
      setDomainWarning(value.length > 5 && !value.endsWith('@jspmrscoe.edu.in'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.endsWith('@jspmrscoe.edu.in')) {
      toast.error('Email must end with @jspmrscoe.edu.in');
      return;
    }
    setLoading(true);
    try {
      const res = await studentLogin(form);
      const { token, user } = res.data.data;
      login(token, { ...user, role: 'student' });
      toast.success(`Welcome, ${user.name}!`);

      // Redirect to pending QR URL if present
      const pendingUrl = sessionStorage.getItem('pendingQR');
      if (pendingUrl) {
        sessionStorage.removeItem('pendingQR');
        window.location.href = pendingUrl;
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-indigo-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-lg">WorkShield</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Student Portal
          </h1>
          <p className="text-blue-200 mt-4 text-lg leading-relaxed">
            Scan QR codes, track attendance, and download your certificates — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {[
              '📱 Scan QR codes to mark attendance',
              '✅ Real-time verification status',
              '⭐ Submit workshop feedback',
              '🏆 Download digital certificates'
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0"></div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-xs">
          © 2026 WorkShield — JSPM's RSCOE | Dept. of Automation & Robotics
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-800 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">WorkShield</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">Student Sign In</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your college credentials to continue</p>

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
                  placeholder="rollno@jspmrscoe.edu.in"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    domainWarning
                      ? 'border-amber-300 focus:ring-amber-400'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
              </div>
              {domainWarning && (
                <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Must end with @jspmrscoe.edu.in
                </div>
              )}
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
                  placeholder="Your roll number"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Default password is your roll number</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                : 'Sign In'
              }
            </button>

            <p className="text-center text-sm text-slate-500">
              Faculty?{' '}
              <a href="/faculty/login" className="text-blue-700 font-medium hover:underline">
                Login here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}