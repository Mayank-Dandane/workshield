import { useState, useEffect } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import { getMyAttendance } from '../../api/attendance.api';
import {
  ClipboardList, CheckCircle, XCircle,
  Clock, Calendar, Timer
} from 'lucide-react';

const StatusBadge = ({ log }) => {
  if (log.verified_status) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
      <CheckCircle className="w-3 h-3" /> Verified
    </span>
  );
  if (log.exit_time) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
      <XCircle className="w-3 h-3" /> Not Verified
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
      <Clock className="w-3 h-3" /> In Progress
    </span>
  );
};

export default function MyAttendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyAttendance();
        setLogs(res.data.data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const verified = logs.filter(l => l.verified_status).length;
  const total = logs.length;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your workshop participation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Workshops', value: total, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Verified', value: verified, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Pending', value: total - verified, color: 'text-amber-700', bg: 'bg-amber-50' }
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Attendance list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-700" />
            <h2 className="font-semibold text-slate-800 text-sm">Attendance Records</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No attendance records yet</p>
              <p className="text-slate-400 text-sm mt-1">Scan a QR code to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.map((log) => (
                <div key={log._id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        {/* ✅ topic instead of title */}
                        <p className="font-semibold text-slate-800 text-sm">
                          {log.workshop_id?.topic || 'Workshop'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {log.workshop_id?.date
                            ? new Date(log.workshop_id.date).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'long', year: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge log={log} />
                  </div>

                  {/* Time details */}
                  <div className="mt-3 ml-13 flex flex-wrap gap-4 ml-12">
                    {log.entry_time && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Entry: {new Date(log.entry_time).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </div>
                    )}
                    {log.exit_time && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        Exit: {new Date(log.exit_time).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </div>
                    )}
                    {log.total_duration_minutes > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Timer className="w-3 h-3" />
                        {log.total_duration_minutes} mins
                      </div>
                    )}
                  </div>

                  {/* Verification note */}
                  {log.verification_note && !log.verified_status && (
                    <div className="mt-2 ml-12 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                      ⚠️ {log.verification_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
}