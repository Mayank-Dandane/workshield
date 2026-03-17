import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { submitFeedback, getMyFeedback } from '../../api/feedback.api';
import { getMyAttendance } from '../../api/attendance.api';
import toast from 'react-hot-toast';
import {
  MessageSquare, Star, CheckCircle, Send,
  ChevronDown, ChevronUp, BookOpen, User, BarChart2
} from 'lucide-react';

// ── College template questions ────────────────────────────────────
const SECTIONS = [
  {
    title: 'Session Content',
    subtitle: '1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent',
    questions: [
      'The objectives of the session were clearly defined',
      'The content of the session was relevant to my course / curriculum',
      'The session enhanced my understanding of the subject / topic',
      'The content was well-structured and easy to follow',
      'The session provided practical / industry / real-world insights',
    ]
  },
  {
    title: 'Resource Person',
    subtitle: '1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent',
    questions: [
      'Knowledge and expertise of the resource person',
      'Communication skills and clarity of explanation',
      'Ability to engage and interact with students',
      'Effectiveness in answering questions and doubts',
    ]
  },
  {
    title: 'Overall Effectiveness',
    subtitle: '1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent',
    questions: [
      'Overall quality of the session',
      'The session motivated me towards self-learning / lifelong learning',
      'The session contributed to achieving Professional Skills',
    ]
  }
];

const ALL_QUESTIONS = SECTIONS.flatMap(s => s.questions);

const HELPED_IN_OPTIONS = [
  'Improving technical knowledge',
  'Understanding industry expectations',
  'Enhancing soft skills / personality',
  'Career guidance / higher studies preparation',
  'Stress management / mental well-being',
  'Ethical / value-based learning',
  'Competitive exam preparation',
];

const RECOMMEND_OPTIONS = ['Strongly Agree', 'Agree', 'Neutral', 'Disagree'];

// ── Star Rating ───────────────────────────────────────────────────
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => onChange(star)}
        className="transition-transform hover:scale-110 focus:outline-none">
        <Star className={`w-6 h-6 transition-colors ${star <= value
          ? 'text-amber-400 fill-amber-400'
          : 'text-slate-200 fill-slate-200'}`} />
      </button>
    ))}
    {value > 0 && (
      <span className="ml-1 text-xs text-slate-400 self-center">
        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
      </span>
    )}
  </div>
);

// ── Main Component ────────────────────────────────────────────────
export default function Feedback() {
  const navigate = useNavigate();
  const [verifiedLogs, setVerifiedLogs]           = useState([]);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop]   = useState('');
  const [ratings, setRatings]                     = useState(ALL_QUESTIONS.map(q => ({ question: q, score: 0 })));
  const [helpedIn, setHelpedIn]                   = useState([]);
  const [recommend, setRecommend]                 = useState('');
  const [likedMost, setLikedMost]                 = useState('');
  const [suggestions, setSuggestions]             = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [loading, setLoading]                     = useState(true);
  const [submitting, setSubmitting]               = useState(false);
  const [showAllFeedbacks, setShowAllFeedbacks]   = useState(false);
  const [currentSection, setCurrentSection]       = useState(0); // wizard step

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, feedRes] = await Promise.all([getMyAttendance(), getMyFeedback()]);
        const verified  = (attRes.data.data.logs || []).filter(l => l.verified_status);
        const feedbacks = [...(feedRes.data.data.feedbacks || [])].sort(
          (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
        );
        setVerifiedLogs(verified);
        setSubmittedFeedbacks(feedbacks);
        const pending = verified.filter(l =>
          !feedbacks.some(f => f.workshop_id?._id === l.workshop_id?._id)
        );
        if (pending.length > 0) setSelectedWorkshop(pending[0].workshop_id?._id || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const alreadySubmitted = (wid) => submittedFeedbacks.some(f => f.workshop_id?._id === wid);
  const pendingWorkshops  = verifiedLogs.filter(l => !alreadySubmitted(l.workshop_id?._id));
  const visibleFeedbacks  = showAllFeedbacks ? submittedFeedbacks : submittedFeedbacks.slice(0, 3);

  const handleRating = (index, score) => {
    const updated = [...ratings];
    updated[index] = { ...updated[index], score };
    setRatings(updated);
  };

  const toggleHelpedIn = (option) => {
    setHelpedIn(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  // Section-wise question indices
  const getSectionIndices = (sectionIdx) => {
    let start = 0;
    for (let i = 0; i < sectionIdx; i++) start += SECTIONS[i].questions.length;
    return { start, end: start + SECTIONS[sectionIdx].questions.length };
  };

  const isSectionComplete = (sectionIdx) => {
    const { start, end } = getSectionIndices(sectionIdx);
    return ratings.slice(start, end).every(r => r.score > 0);
  };

  const TOTAL_STEPS = SECTIONS.length + 1; // 3 rating sections + 1 final section

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      if (!isSectionComplete(currentSection)) {
        return toast.error('Please rate all questions before continuing');
      }
      setCurrentSection(s => s + 1);
    } else if (currentSection === SECTIONS.length - 1) {
      if (!isSectionComplete(currentSection)) {
        return toast.error('Please rate all questions before continuing');
      }
      setCurrentSection(SECTIONS.length); // go to final section
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkshop)               return toast.error('Please select a workshop');
    if (ratings.some(r => r.score === 0)) return toast.error('Please complete all ratings');
    if (!recommend)                       return toast.error('Please answer the recommendation question');
    if (!likedMost.trim())                return toast.error('Please fill in what you liked most');

    setSubmitting(true);
    try {
      await submitFeedback({
        workshop_id:         selectedWorkshop,
        ratings,
        helped_in:           helpedIn,
        recommend,
        liked_most:          likedMost,
        suggestions,
        additional_comments: additionalComments,
      });
      toast.success('🎉 Feedback submitted! Redirecting to certificates...');
      setTimeout(() => navigate('/student/certificates'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800" />
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
                <button onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
                  className="w-full py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5">
                  {showAllFeedbacks
                    ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                    : <><ChevronDown className="w-4 h-4" /> Show {submittedFeedbacks.length - 3} More</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* No pending */}
        {pendingWorkshops.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No pending feedback</p>
            <p className="text-slate-400 text-sm mt-1">Attend and get verified in a workshop to submit feedback</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Workshop selector */}
            <div className="p-4 border-b border-slate-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-700" />
              <h2 className="font-semibold text-slate-800 text-sm">Submit Feedback</h2>
            </div>
            <div className="px-6 pt-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Workshop</label>
              <select value={selectedWorkshop} onChange={e => { setSelectedWorkshop(e.target.value); setCurrentSection(0); }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="">Choose a workshop...</option>
                {pendingWorkshops.map((log) => (
                  <option key={log._id} value={log.workshop_id?._id}>
                    {log.workshop_id?.topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress bar */}
            {selectedWorkshop && (
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">
                    {currentSection < SECTIONS.length
                      ? `Section ${currentSection + 1} of ${TOTAL_STEPS}: ${SECTIONS[currentSection].title}`
                      : `Section ${TOTAL_STEPS} of ${TOTAL_STEPS}: Open-ended`}
                  </span>
                  <span className="text-xs text-blue-700 font-medium">
                    {Math.round(((currentSection) / TOTAL_STEPS) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentSection) / TOTAL_STEPS) * 100}%` }} />
                </div>
              </div>
            )}

            {selectedWorkshop && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">

                {/* Rating sections (steps 0, 1, 2) */}
                {currentSection < SECTIONS.length && (() => {
                  const section = SECTIONS[currentSection];
                  const { start } = getSectionIndices(currentSection);
                  return (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        {currentSection === 0 && <BookOpen className="w-4 h-4 text-blue-700" />}
                        {currentSection === 1 && <User className="w-4 h-4 text-blue-700" />}
                        {currentSection === 2 && <BarChart2 className="w-4 h-4 text-blue-700" />}
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{section.title}</p>
                          <p className="text-xs text-slate-400">{section.subtitle}</p>
                        </div>
                      </div>
                      {section.questions.map((q, i) => (
                        <div key={i} className="space-y-2">
                          <p className="text-sm text-slate-700">{i + 1}. {q}</p>
                          <StarRating
                            value={ratings[start + i].score}
                            onChange={(score) => handleRating(start + i, score)}
                          />
                        </div>
                      ))}
                      <button type="button" onClick={handleNext}
                        className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-sm font-semibold transition-colors">
                        Next →
                      </button>
                    </div>
                  );
                })()}

                {/* Final section — checkboxes + recommend + open-ended */}
                {currentSection === SECTIONS.length && (
                  <div className="space-y-6">

                    {/* Q21 — Helped in */}
                    <div className="space-y-3">
                      <p className="font-semibold text-slate-800 text-sm">The session helped in <span className="text-slate-400 font-normal">(select all that apply)</span></p>
                      <div className="grid grid-cols-1 gap-2">
                        {HELPED_IN_OPTIONS.map(opt => (
                          <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            helpedIn.includes(opt)
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}>
                            <input type="checkbox" checked={helpedIn.includes(opt)}
                              onChange={() => toggleHelpedIn(opt)}
                              className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Q22 — Recommend */}
                    <div className="space-y-3">
                      <p className="font-semibold text-slate-800 text-sm">I would recommend similar sessions in future <span className="text-red-400">*</span></p>
                      <div className="grid grid-cols-2 gap-2">
                        {RECOMMEND_OPTIONS.map(opt => (
                          <button key={opt} type="button" onClick={() => setRecommend(opt)}
                            className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors ${
                              recommend === opt
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q25 — Liked most */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                        What did you like most about the session? <span className="text-red-400">*</span>
                      </label>
                      <textarea value={likedMost} onChange={e => setLikedMost(e.target.value)}
                        placeholder="Share what you found most valuable..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm" />
                    </div>

                    {/* Q26 — Suggestions */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                        Suggestions for improvement <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea value={suggestions} onChange={e => setSuggestions(e.target.value)}
                        placeholder="How can we improve future sessions?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm" />
                    </div>

                    {/* Q27 — Additional comments */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                        Any additional comments or recommendations <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea value={additionalComments} onChange={e => setAdditionalComments(e.target.value)}
                        placeholder="Any other thoughts..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm" />
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setCurrentSection(s => s - 1)}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                        ← Back
                      </button>
                      <button type="submit" disabled={submitting}
                        className="flex-1 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                        {submitting
                          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><Send className="w-4 h-4" /> Submit Feedback</>}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}