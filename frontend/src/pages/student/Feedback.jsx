import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { submitFeedback, getMyFeedback } from '../../api/feedback.api';
import { getMyAttendance } from '../../api/attendance.api';
import toast from 'react-hot-toast';
import { MessageSquare, Star, CheckCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

const QUESTIONS = [
  'How was the content quality?',
  "How was the speaker's delivery?",
  'How useful was this workshop?',
  'How would you rate the organization?'
];

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => onChange(star)} className="transition-transform hover:scale-110">
        <Star className={`w-7 h-7 transition-colors ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      </button>
    ))}
  </div>
);

export default function Feedback() {
  const navigate = useNavigate();
  const [verifiedLogs, setVerifiedLogs] = useState([]);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState('');
  const [ratings, setRatings] = useState(QUESTIONS.map(q => ({ question: q, score: 0 })));
  const [comments, setComments] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, feedRes] = await Promise.all([
          getMyAttendance(),
          getMyFeedback()
        ]);
        const verified = (attRes.data.data.logs || []).filter(l => l.verified_status);
        const feedbacks = [...(feedRes.data.data.feedbacks || [])].sort(
          (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
        );
        setVerifiedLogs(verified);
        setSubmittedFeedbacks(feedbacks);

        const pending = verified.filter(l =>
          !feedbacks.some(f => f.workshop_id?._id === l.workshop_id?._id)
        );
        if (pending.length > 0) {
          setSelectedWorkshop(pending[0].workshop_id?._id || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const alreadySubmitted = (workshopId) =>
    submittedFeedbacks.some(f => f.workshop_id?._id === workshopId);

  const handleRating = (index, score) => {
    const updated = [...ratings];
    updated[index] = { ...updated[index], score };
    setRatings(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkshop) return toast.error('Please select a workshop');
    if (ratings.some(r => r.score === 0)) return toast.error('Please rate all questions');

    setSubmitting(true);
    try {
      await submitFeedback({ workshop_id: selectedWorkshop, ratings, comments, suggestions });
      toast.success('🎉 Feedback submitted! Redirecting to certificates...');
      setTimeout(() => navigate('/student/certificates'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingWorkshops = verifiedLogs.filter(l => !alreadySubmitted(l.workshop_id?._id));
  const visibleFeedbacks = showAllFeedbacks ? submittedFeedbacks : submittedFeedbacks.slice(0, 3);

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800"></div>
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-xl font-bold text-slate-800">Workshop Feedback</h1>
          <p className="text-sm text-slate-500 mt-0.5">Share your experience to unlock your certificate</p>
        </div>

        {/* Submitted Feedbacks */}
        {submittedFeedbacks.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Submitted Feedback</h2>
              <span className="ml-auto text-xs text-slate-400">{submittedFeedbacks.length} total</span>
            </div>
            <div className="divide-y divide-slate-50">
              {visibleFeedbacks.map((f) => (
                <div key={f._id} className="p-4 flex items-center justify-between">
                  <div>
                    {/* ✅ topic instead of title */}
                    <p className="font-medium text-slate-800 text-sm">{f.workshop_id?.topic || 'Workshop'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted {new Date(f.submitted_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">{f.overall_rating}</span>
                  </div>
                </div>
              ))}
            </div>
            {submittedFeedbacks.length > 3 && (
              <div className="border-t border-slate-50">
                <button
                  onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
                  className="w-full py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {showAllFeedbacks
                    ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                    : <><ChevronDown className="w-4 h-4" /> Show {submittedFeedbacks.length - 3} More</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback Form */}
        {pendingWorkshops.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No pending feedback</p>
            <p className="text-slate-400 text-sm mt-1">Attend and get verified in a workshop to submit feedback</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-700" />
              <h2 className="font-semibold text-slate-800 text-sm">Submit Feedback</h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Workshop</label>
                <select
                  value={selectedWorkshop}
                  onChange={(e) => setSelectedWorkshop(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Choose a workshop...</option>
                  {pendingWorkshops.map((log) => (
                    <option key={log._id} value={log.workshop_id?._id}>
                      {/* ✅ topic instead of title */}
                      {log.workshop_id?.topic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-5">
                <p className="text-sm font-medium text-slate-700">Rate the following (1-5 stars)</p>
                {QUESTIONS.map((q, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-600 flex-1">{q}</p>
                    <StarRating value={ratings[i].score} onChange={(score) => handleRating(i, score)} />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Comments <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share your thoughts about the workshop..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Suggestions <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="How can we improve future workshops?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  : <><Send className="w-4 h-4" />Submit Feedback</>
                }
              </button>
            </div>
          </form>
        )}

      </div>
    </StudentLayout>
  );
}