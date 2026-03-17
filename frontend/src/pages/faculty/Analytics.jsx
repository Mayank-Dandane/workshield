import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { getWorkshopById } from '../../api/workshop.api';
import { getAttendanceByWorkshop } from '../../api/attendance.api';
import { getFeedbackAnalytics } from '../../api/feedback.api';
import { ArrowLeft, Users, Star, CheckCircle, BarChart2, Mic, ThumbsUp, MessageSquare, Lightbulb } from 'lucide-react';

const RatingBar = ({ label, value, max = 5 }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-slate-500 w-48 flex-shrink-0 truncate" title={label}>{label}</span>
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="text-xs font-semibold text-slate-700 w-8 text-right">{value}</span>
  </div>
);

const SECTIONS = [
  { title: 'Session Content', range: [0, 5] },
  { title: 'Resource Person', range: [5, 9] },
  { title: 'Overall Effectiveness', range: [9, 12] },
];

export default function Analytics() {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop]   = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feedback, setFeedback]   = useState(null);
  const [loading, setLoading]     = useState(true);

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-800" />
      </div>
    </FacultyLayout>
  );

  const verified = attendance.filter(a => a.verified_status).length;
  const speakersList = workshop?.speakers?.length
    ? workshop.speakers
    : workshop?.speaker ? [workshop.speaker] : [];

  const hasFeedback = feedback?.total_submissions > 0;

  return (
    <FacultyLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/faculty/reports')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{workshop?.topic}</h1>
            <p className="text-sm text-slate-500">{workshop?.workshop_id} • Analytics</p>
          </div>
        </div>

        {/* Speakers */}
        {speakersList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm">{speakersList.length > 1 ? 'Speakers' : 'Speaker'}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {speakersList.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Scanned',  value: attendance.length,                icon: Users,       color: 'text-blue-700',   bg: 'bg-blue-50' },
            { label: 'Verified',       value: verified,                          icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Feedback Count', value: feedback?.total_submissions || 0,  icon: BarChart2,   color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Avg Rating',     value: feedback?.overall_average || '—',  icon: Star,        color: 'text-amber-700',  bg: 'bg-amber-50' },
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

        {!hasFeedback ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No feedback submitted yet</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Per-question ratings grouped by section */}
            {SECTIONS.map((sec, si) => {
              const sectionQs = feedback.per_question?.slice(sec.range[0], sec.range[1]) || [];
              if (!sectionQs.length) return null;
              return (
                <div key={si} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />{sec.title}
                  </h2>
                  <div className="space-y-3">
                    {sectionQs.map((q, i) => <RatingBar key={i} label={q.question} value={q.average} />)}
                  </div>
                </div>
              );
            })}

            <div className="grid lg:grid-cols-2 gap-6">

              {/* Rating distribution */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />Rating Distribution
                </h2>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = feedback.rating_distribution?.[star] || 0;
                    const pct   = feedback.total_submissions > 0 ? Math.round((count / feedback.total_submissions) * 100) : 0;
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
              </div>

              {/* Recommend summary */}
              {feedback.recommend_summary && Object.keys(feedback.recommend_summary).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />Would Recommend
                  </h2>
                  <div className="space-y-2">
                    {['Strongly Agree', 'Agree', 'Neutral', 'Disagree'].map(opt => {
                      const count = feedback.recommend_summary[opt] || 0;
                      const pct   = feedback.total_submissions > 0 ? Math.round((count / feedback.total_submissions) * 100) : 0;
                      return (
                        <div key={opt} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-28 flex-shrink-0">{opt}</span>
                          <div className="flex-1 h-4 bg-slate-100 rounded-lg overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-lg transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Helped in */}
              {feedback.helped_in_summary && Object.keys(feedback.helped_in_summary).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-2">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />Session Helped In
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(feedback.helped_in_summary)
                      .sort((a, b) => b[1] - a[1])
                      .map(([opt, count]) => (
                        <div key={opt} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                          <span className="text-xs text-slate-600">{opt}</span>
                          <span className="text-xs font-bold text-blue-700 ml-2">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Liked most */}
              {feedback.liked_most?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />What Students Liked Most
                  </h2>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {feedback.liked_most.map((c, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border-l-2 border-indigo-300">{c}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {feedback.suggestions?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />Suggestions
                  </h2>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {feedback.suggestions.map((s, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border-l-2 border-emerald-300">{s}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional comments */}
              {feedback.additional_comments?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-2">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />Additional Comments
                  </h2>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {feedback.additional_comments.map((c, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border-l-2 border-slate-300">{c}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}