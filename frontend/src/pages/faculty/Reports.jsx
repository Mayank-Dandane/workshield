import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { getAllWorkshops } from '../../api/workshop.api';
import { generateReport } from '../../api/report.api';
import { exportAttendanceExcel } from '../../api/attendance.api';
import { getFeedbackAnalytics } from '../../api/feedback.api';
import toast from 'react-hot-toast';
import {
  FileText, Download, BarChart2,
  BookOpen, Calendar, Users, Star
} from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [exporting, setExporting] = useState('');
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllWorkshops();
        const ws = res.data.data.workshops || [];
        setWorkshops(ws);

        // Fetch analytics for each workshop
        const analyticsData = {};
        await Promise.all(ws.map(async (w) => {
          try {
            const r = await getFeedbackAnalytics(w._id);
            analyticsData[w._id] = r.data.data;
          } catch (e) {}
        }));
        setAnalytics(analyticsData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleReport = async (workshopId, workshopCode) => {
    setGenerating(workshopId);
    try {
      const res = await generateReport(workshopId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${workshopCode}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  const handleExcel = async (workshopId, workshopCode) => {
    setExporting(workshopId);
    try {
      const res = await exportAttendanceExcel(workshopId);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${workshopCode}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed — no verified students?');
    } finally {
      setExporting('');
    }
  };

  return (
    <FacultyLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate reports and export attendance sheets</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-800"></div>
          </div>
        ) : workshops.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No workshops yet</p>
            <button
              onClick={() => navigate('/faculty/create-workshop')}
              className="mt-4 px-4 py-2 bg-indigo-800 text-white rounded-xl text-sm font-medium"
            >
              Create Workshop
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workshops.map((w) => {
              const a = analytics[w._id];
              return (
                <div key={w._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-indigo-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{w.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {w.workshop_id} • {new Date(w.date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                        w.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        w.status === 'locked' ? 'bg-red-50 text-red-600' :
                        w.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {w.status}
                      </span>
                    </div>

                    {/* Analytics mini stats */}
                    {a && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-slate-800">{a.total_submissions || 0}</p>
                          <p className="text-xs text-slate-400">Feedback</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-slate-800">{a.overall_average || '—'}</p>
                          <p className="text-xs text-slate-400">Avg Rating</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-slate-800">{w.min_duration_minutes}</p>
                          <p className="text-xs text-slate-400">Min Mins</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleExcel(w._id, w.workshop_id)}
                        disabled={exporting === w._id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                      >
                        {exporting === w._id
                          ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin"></div>
                          : <Download className="w-4 h-4" />
                        }
                        Export Excel
                      </button>
                      <button
                        onClick={() => handleReport(w._id, w.workshop_id)}
                        disabled={generating === w._id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                      >
                        {generating === w._id
                          ? <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin"></div>
                          : <FileText className="w-4 h-4" />
                        }
                        Generate Report
                      </button>
                      <button
                        onClick={() => navigate(`/faculty/analytics/${w._id}`)}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                      >
                        <BarChart2 className="w-4 h-4" />
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </FacultyLayout>
  );
}