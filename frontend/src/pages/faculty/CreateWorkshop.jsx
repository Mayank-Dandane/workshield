import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { createWorkshop } from '../../api/workshop.api';
import toast from 'react-hot-toast';
import { PlusCircle, ArrowLeft, BookOpen, X, UserPlus, MapPin, FileText } from 'lucide-react';

const InputField = ({ label, name, type = 'text', placeholder, required = true, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      type={type} name={name} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = true }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <select
      name={name} value={value} onChange={onChange} required={required}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const YEAR_OPTIONS = [
  { value: 'FY', label: 'F.Y B.Tech — First Year' },
  { value: 'SY', label: 'S.Y B.Tech — Second Year' },
  { value: 'TY', label: 'T.Y B.Tech — Third Year' },
  { value: 'BY', label: 'B.Y B.Tech — Fourth Year' },
];

const REPORT_TYPE_OPTIONS = [
  { value: 'Report on Industry Expert Session', label: 'Industry Expert Session' },
  { value: 'Report on Guest Lecture',           label: 'Guest Lecture' },
  { value: 'Report on Workshop',                label: 'Workshop' },
  { value: 'Report on Induction Program',       label: 'Induction Program' },
  { value: 'Report on Seminar',                 label: 'Seminar' },
];

export default function CreateWorkshop() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    topic:                '',
    date:                 '',
    start_time:           '',
    end_time:             '',
    min_duration_minutes: 60,
    random_check_enabled: false,
    // ── New report fields ──
    venue:         '',
    industry_name: '',
    designation:   '',
    targeted_year: 'SY',
    report_type:   'Report on Industry Expert Session',
  });
  const [speakers, setSpeakers] = useState(['']);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSpeakerChange = (index, value) => {
    const updated = [...speakers];
    updated[index] = value;
    setSpeakers(updated);
  };

  const addSpeaker    = () => setSpeakers([...speakers, '']);
  const removeSpeaker = (index) => {
    if (speakers.length === 1) return;
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filteredSpeakers = speakers.map(s => s.trim()).filter(Boolean);
    if (filteredSpeakers.length === 0) return toast.error('At least one speaker is required');
    setLoading(true);
    try {
      const res = await createWorkshop({ ...form, speakers: filteredSpeakers });
      const workshop = res.data.data.workshop;
      toast.success(`Workshop "${workshop.title}" created! ID: ${workshop.workshop_id}`);
      navigate('/faculty/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workshop');
    } finally {
      setLoading(false);
    }
  };

  // Preview the dynamic letterhead line as faculty fills in the form
  const yearPreview = YEAR_OPTIONS.find(o => o.value === form.targeted_year)?.label.split('—')[0].trim();
  const yearNow     = new Date().getFullYear();
  const ayPreview   = new Date(form.date || Date.now()).getMonth() >= 5
    ? `${new Date(form.date || Date.now()).getFullYear()}-${new Date(form.date || Date.now()).getFullYear() + 1}`
    : `${new Date(form.date || Date.now()).getFullYear() - 1}-${new Date(form.date || Date.now()).getFullYear()}`;

  return (
    <FacultyLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/faculty/dashboard')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create Workshop</h1>
            <p className="text-sm text-slate-500">Set up a new workshop session</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* ── Section 1: Basic Info ── */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-indigo-700" />
              </div>
              <h2 className="font-semibold text-slate-800">Workshop Details</h2>
            </div>
            <div className="space-y-4">
              <InputField label="Topic" name="topic" placeholder="e.g. Step In, Stand Out: Internships & Career Success" value={form.topic} onChange={handleChange} />

              {/* Speakers */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Speaker(s)</label>
                <div className="space-y-2">
                  {speakers.map((speaker, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text" value={speaker}
                        onChange={(e) => handleSpeakerChange(index, e.target.value)}
                        placeholder="e.g. Mr. Swajas Balekar"
                        required={index === 0}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      {speakers.length > 1 && (
                        <button type="button" onClick={() => removeSpeaker(index)}
                          className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addSpeaker}
                  className="mt-2 flex items-center gap-1.5 text-sm text-indigo-700 hover:text-indigo-900 font-medium transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Add Another Speaker
                </button>
              </div>

              {/* Designation */}
              <InputField
                label="Speaker's Designation"
                name="designation"
                placeholder="e.g. Assistant Product Manager – OEM Components"
                value={form.designation}
                onChange={handleChange}
                required={false}
              />

              {/* Industry */}
              <InputField
                label="Name of Industry / Organisation"
                name="industry_name"
                placeholder="e.g. Tetra Pak, ISRO, TCS"
                value={form.industry_name}
                onChange={handleChange}
                required={false}
              />
            </div>
          </div>

          {/* ── Section 2: Schedule ── */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-indigo-700" />
              </div>
              <h2 className="font-semibold text-slate-800">Schedule & Venue</h2>
            </div>
            <div className="space-y-4">
              <InputField label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Start Time" name="start_time" type="time" value={form.start_time} onChange={handleChange} />
                <InputField label="End Time"   name="end_time"   type="time" value={form.end_time}   onChange={handleChange} />
              </div>
              <InputField
                label="Venue"
                name="venue"
                placeholder="e.g. C-101, Seminar Hall, Main Auditorium"
                value={form.venue}
                onChange={handleChange}
                required={false}
              />
            </div>
          </div>

          {/* ── Section 3: Report Fields ── */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-700" />
              </div>
              <h2 className="font-semibold text-slate-800">Report Details</h2>
            </div>
            <div className="space-y-4">

              {/* Targeted Year dropdown */}
              <SelectField
                label="Targeted Year (Students)"
                name="targeted_year"
                value={form.targeted_year}
                onChange={handleChange}
                options={YEAR_OPTIONS}
              />

              {/* Report type dropdown */}
              <SelectField
                label="Report Type"
                name="report_type"
                value={form.report_type}
                onChange={handleChange}
                options={REPORT_TYPE_OPTIONS}
              />

              {/* Live preview of letterhead line */}
              {form.date && (
                <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-xs text-indigo-500 mt-0.5">📄</span>
                  <div>
                    <p className="text-xs font-medium text-indigo-700">Letterhead preview</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Department of Automation and Robotics<br />
                      <span className="font-semibold">{yearPreview} B. Tech. &nbsp; A.Y. {ayPreview}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 4: Attendance Settings ── */}
          <div className="p-6">
            <h2 className="font-semibold text-slate-800 mb-5">Attendance Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum Attendance Duration (minutes)</label>
                <input
                  type="number" name="min_duration_minutes" value={form.min_duration_minutes}
                  onChange={handleChange} min="1" required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">Students must attend at least this many minutes to be verified</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Enable Random Check</p>
                  <p className="text-xs text-slate-400 mt-0.5">Students must scan a mid-session QR to confirm presence</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, random_check_enabled: !form.random_check_enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.random_check_enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.random_check_enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="px-6 pb-6">
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                : <><PlusCircle className="w-4 h-4" />Create Workshop</>
              }
            </button>
          </div>
        </form>
      </div>
    </FacultyLayout>
  );
}