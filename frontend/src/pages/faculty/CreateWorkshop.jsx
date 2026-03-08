import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { createWorkshop } from '../../api/workshop.api';
import toast from 'react-hot-toast';
import { PlusCircle, ArrowLeft, BookOpen } from 'lucide-react';

// ── Outside component to prevent re-render focus loss ──────────
const InputField = ({ label, name, type = 'text', placeholder, required = true, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
    />
  </div>
);

export default function CreateWorkshop() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    topic: '',
    speaker: '',
    date: '',
    start_time: '',
    end_time: '',
    min_duration_minutes: 60,
    random_check_enabled: false
  });

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createWorkshop(form);
      const workshop = res.data.data.workshop;
      toast.success(`Workshop "${workshop.title}" created! ID: ${workshop.workshop_id}`);
      navigate('/faculty/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workshop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FacultyLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/faculty/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create Workshop</h1>
            <p className="text-sm text-slate-500">Set up a new workshop session</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Section 1 — Basic Info */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-indigo-700" />
              </div>
              <h2 className="font-semibold text-slate-800">Workshop Details</h2>
            </div>
            <div className="space-y-4">
              <InputField
                label="Workshop Title"
                name="title"
                placeholder="e.g. Web Development Bootcamp"
                value={form.title}
                onChange={handleChange}
              />
              <InputField
                label="Topic"
                name="topic"
                placeholder="e.g. Full Stack with React & Node.js"
                value={form.topic}
                onChange={handleChange}
              />
              <InputField
                label="Speaker Name"
                name="speaker"
                placeholder="e.g. Dr. Priya Menon"
                value={form.speaker}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section 2 — Schedule */}
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800 mb-5">Schedule</h2>
            <div className="space-y-4">
              <InputField
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Start Time"
                  name="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={handleChange}
                />
                <InputField
                  label="End Time"
                  name="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 3 — Attendance Settings */}
          <div className="p-6">
            <h2 className="font-semibold text-slate-800 mb-5">Attendance Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Minimum Attendance Duration (minutes)
                </label>
                <input
                  type="number"
                  name="min_duration_minutes"
                  value={form.min_duration_minutes}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Students must attend at least this many minutes to be verified
                </p>
              </div>

              {/* Random check toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Enable Random Check</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Students must scan a mid-session QR to confirm presence
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, random_check_enabled: !form.random_check_enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.random_check_enabled ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    form.random_check_enabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Create Workshop
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </FacultyLayout>
  );
}