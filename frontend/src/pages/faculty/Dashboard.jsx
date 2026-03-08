import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { getAllWorkshops, updateWorkshopStatus } from '../../api/workshop.api';
import toast from 'react-hot-toast';
import {
  PlusCircle, Radio, FileText, BarChart2,
  Calendar, Users, CheckCircle, Clock,
  Lock, Play, ChevronRight, BookOpen
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    upcoming: 'bg-blue-50 text-blue-700 border-blue-100',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-slate-50 text-slate-600 border-slate-100',
    locked: 'bg-red-50 text-red-600 border-red-100'
  };
  const icons = {
    upcoming: <Clock className="w-3 h-3" />,
    active: <Radio className="w-3 h-3" />,
    completed: <CheckCircle className="w-3 h-3" />,
    locked: <Lock className="w-3 h-3" />
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.upcoming}`}>
      {icons[status]} {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const res = await getAllWorkshops();
      setWorkshops(res.data.data.workshops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (workshopId) => {
    try {
      await updateWorkshopStatus(workshopId, 'active');
      toast.success('Workshop activated!');
      fetchWorkshops();
    } catch (err) {
      toast.error('Failed to activate workshop');
    }
  };

  const total = workshops.length;
  const active = workshops.filter(w => w.status === 'active').length;
  const upcoming = workshops.filter(w => w.status === 'upcoming').length;
  const completed = workshops.filter(w => w.status === 'completed' || w.status === 'locked').length;

  return (
    <FacultyLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-800 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Welcome back 👋</p>
              <h1 className="text-2xl font-bold mt-1">{user?.name}</h1>
              <p className="text-indigo-200 text-sm mt-1">{user?.department} — {user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={() => navigate('/faculty/create-workshop')}
              className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm border border-white/20"
            >
              <PlusCircle className="w-4 h-4" />
              New Workshop
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Workshops', value: total, color: 'text-blue-700', bg: 'bg-blue-50', icon: BookOpen },
            { label: 'Active Now', value: active, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Radio },
            { label: 'Upcoming', value: upcoming, color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
            { label: 'Completed', value: completed, color: 'text-slate-600', bg: 'bg-slate-100', icon: CheckCircle }
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: PlusCircle, label: 'Create Workshop', desc: 'Set up a new workshop', color: 'text-indigo-700', bg: 'bg-indigo-50', path: '/faculty/create-workshop' },
            { icon: FileText, label: 'Reports', desc: 'Generate PDF reports', color: 'text-blue-700', bg: 'bg-blue-50', path: '/faculty/reports' },
            { icon: BarChart2, label: 'Analytics', desc: 'View feedback data', color: 'text-violet-700', bg: 'bg-violet-50', path: '/faculty/reports' }
          ].map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left group"
            >
              <div className={`w-10 h-10 ${a.bg} rounded-xl flex items-center justify-center mb-3`}>
                <a.icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{a.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Workshops list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Your Workshops</h2>
            <button
              onClick={() => navigate('/faculty/create-workshop')}
              className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-800"
            >
              <PlusCircle className="w-4 h-4" />
              New
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-800 mx-auto"></div>
              </div>
            ) : workshops.length === 0 ? (
              <div className="p-10 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No workshops yet</p>
                <button
                  onClick={() => navigate('/faculty/create-workshop')}
                  className="mt-4 px-4 py-2 bg-indigo-800 text-white rounded-xl text-sm font-medium hover:bg-indigo-900 transition-colors"
                >
                  Create First Workshop
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {workshops.map((w) => (
                  <div key={w._id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-indigo-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{w.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(w.date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })} • {w.start_time} - {w.end_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={w.status} />
                        {w.status === 'upcoming' && (
                          <button
                            onClick={() => handleActivate(w._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            Start
                          </button>
                        )}
                        {w.status === 'active' && (
                          <button
                            onClick={() => navigate(`/faculty/live/${w._id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Radio className="w-3 h-3" />
                            Live
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/faculty/analytics/${w._id}`)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </FacultyLayout>
  );
}