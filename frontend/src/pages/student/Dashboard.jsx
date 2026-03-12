import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentLayout from '../../components/student/StudentLayout';
import { getMyAttendance } from '../../api/attendance.api';
import { getMyCertificates } from '../../api/certificate.api';
import { getMyFeedback } from '../../api/feedback.api';
import {
  QrCode, Award, ClipboardList, MessageSquare,
  CheckCircle, Clock, XCircle, ChevronRight,
  TrendingUp, Calendar
} from 'lucide-react';

// ── Stat Card ──────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
  </div>
);

// ── Quick Action Card ──────────────────────────────────────────
const ActionCard = ({ icon: Icon, label, desc, color, bg, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left w-full group"
  >
    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <p className="font-semibold text-slate-800 text-sm">{label}</p>
    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    <div className="flex items-center gap-1 mt-3">
      <span className={`text-xs font-medium ${color}`}>Go</span>
      <ChevronRight className={`w-3 h-3 ${color} group-hover:translate-x-0.5 transition-transform`} />
    </div>
  </button>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, certRes, feedRes] = await Promise.all([
          getMyAttendance(),
          getMyCertificates(),
          getMyFeedback()
        ]);
        setAttendance(attRes.data.data.logs || []);
        setCertificates(certRes.data.data.certificates || []);
        setFeedback(feedRes.data.data.feedbacks || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const verified = attendance.filter(a => a.verified_status).length;
  const pending = attendance.filter(a => !a.verified_status).length;

  const getStatusIcon = (log) => {
    if (log.verified_status) return <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>;
    if (log.exit_time) return <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Not Verified</span>;
    return <span className="flex items-center gap-1 text-amber-500 text-xs font-medium"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
  };

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800"></div>
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Welcome ── */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Welcome back 👋</p>
              <h1 className="text-2xl font-bold mt-1">{user?.name}</h1>
              <p className="text-blue-200 text-sm mt-1">
                {user?.department} — Year {user?.year} | {user?.roll_number}
              </p>
            </div>
            <div className="hidden sm:block w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Workshops Attended" value={attendance.length} color="text-blue-700" bg="bg-blue-50" />
          <StatCard icon={CheckCircle} label="Verified" value={verified} color="text-emerald-700" bg="bg-emerald-50" />
          <StatCard icon={MessageSquare} label="Feedback Given" value={feedback.length} color="text-violet-700" bg="bg-violet-50" />
          <StatCard icon={Award} label="Certificates" value={certificates.length} color="text-amber-700" bg="bg-amber-50" />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard icon={QrCode} label="Scan QR" desc="Mark your attendance" color="text-blue-700" bg="bg-blue-50" onClick={() => navigate('/student/scan')} />
            <ActionCard icon={ClipboardList} label="Attendance" desc="View your records" color="text-emerald-700" bg="bg-emerald-50" onClick={() => navigate('/student/attendance')} />
            <ActionCard icon={MessageSquare} label="Feedback" desc="Rate workshops" color="text-violet-700" bg="bg-violet-50" onClick={() => navigate('/student/feedback')} />
            <ActionCard icon={Award} label="Certificates" desc="Download yours" color="text-amber-700" bg="bg-amber-50" onClick={() => navigate('/student/certificates')} />
          </div>
        </div>

        {/* ── Recent Workshops ── */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Recent Workshops</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {attendance.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No workshops yet</p>
                <p className="text-slate-400 text-sm mt-1">Scan a QR code to attend your first workshop!</p>
                <button onClick={() => navigate('/student/scan')} className="mt-4 px-4 py-2 bg-blue-800 text-white rounded-xl text-sm font-medium hover:bg-blue-900 transition-colors">
                  Scan QR Now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {attendance.slice(0, 5).map((log) => (
                  <div key={log._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        {/* ✅ topic instead of title */}
                        <p className="font-medium text-slate-800 text-sm">
                          {log.workshop_id?.topic || 'Workshop'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {log.workshop_id?.date
                            ? new Date(log.workshop_id.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'N/A'}
                          {log.total_duration_minutes > 0 && ` • ${log.total_duration_minutes} mins`}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(log)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}