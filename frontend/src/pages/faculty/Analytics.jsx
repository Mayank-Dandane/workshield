import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { getWorkshopById } from '../../api/workshop.api';
import { getAttendanceByWorkshop } from '../../api/attendance.api';
import { getFeedbackAnalytics } from '../../api/feedback.api';
import { ArrowLeft, Users, Star, CheckCircle, Clock, BarChart2, Mic } from 'lucide-react';

const RatingBar = ({ label, value, max = 5 }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-slate-500 w-32 flex-shrink-0 truncate">{label}</span>
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="text-xs font-semibold text-slate-700 w-8 text-right">{value}</span>
  </div>
);

export default function Analytics() {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, aRes, fRes] = await Promise.all([
          getWorkshopById(workshopId),
          getAttendanceByWorkshop(workshopId),
          getFeedbackAnalytics(workshopId)
        ]);
        setWorkshop(wRes.data.data.workshop);
        setAttendance(aRes.data.data.logs || []);
        setFeedback(fRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workshopId]);

  if (loading) return (
    <FacultyLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-800"></div>
      </div>
    </FacultyLayout>
  );

  const verified = attendance.filter(a => a.verified_status).length;
  const speakersList = workshop?.speakers?.length
    ? workshop.speakers
    : workshop?.speaker
      ? [workshop.speaker]
      : [];

  return (
    <FacultyLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/faculty/reports')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{workshop?.title}</h1>
            <p className="text-sm text-slate-500">{workshop?.workshop_id} • Analytics</p>
          </div>
        </div>

        {/* Speakers */}
        {speakersList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm">
                {speakersList.length > 1 ? 'Speakers' : 'Speaker'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {speakersList.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Scanned', value: attendance.length, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Verified', value: verified, icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Feedback Count', value: feedback?.total_submissions || 0, icon: BarChart2, color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Avg Rating', value: feedback?.overall_average || '—', icon: Star, color: 'text-amber-700', bg: 'bg-amber-50' }
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

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Feedback per question */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />Question-wise Ratings
            </h2>
            {feedback?.per_question?.length ? (
              <div className="space-y-3">
                {feedback.per_question.map((q, i) => <RatingBar key={i} label={q.question} value={q.average} />)}
              </div>
            ) : <p className="text-slate-400 text-sm text-center py-6">No feedback yet</p>}
          </div>

          {/* Rating distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />Rating Distribution
            </h2>
            {feedback?.rating_distribution ? (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = feedback.rating_distribution[star] || 0;
                  const pct = feedback.total_submissions > 0 ? Math.round((count / feedback.total_submissions) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-10">{star} ★</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-lg transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-slate-400 text-sm text-center py-6">No feedback yet</p>}
          </div>

          {/* Comments */}
          {feedback?.comments?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Student Comments</h2>
              <div className="space-y-2">
                {feedback.comments.map((c, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border-l-2 border-indigo-300">{c}</div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {feedback?.suggestions?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Suggestions</h2>
              <div className="space-y-2">
                {feedback.suggestions.map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border-l-2 border-emerald-300">{s}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </FacultyLayout>
  );
}