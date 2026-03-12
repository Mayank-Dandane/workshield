import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Users, UserPlus, GraduationCap, BookOpen, BarChart2,
  Upload, Download, Search, LogOut, CheckCircle, XCircle,
  Eye, EyeOff, ChevronDown, ChevronUp, Shield, Loader2,
  FileSpreadsheet, AlertTriangle, RefreshCw, X, Plus
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// ── API helpers ───────────────────────────────────────────────────
const authFetch = (token) => async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data.data;
};

// ── Smart column name normalizer ──────────────────────────────────
// Maps college Excel headers → exact backend field names
// College format: Sr No | PRN No. | Candidate Name | Official Email ID
const COLUMN_MAP = {
  // PRN / roll number — college uses "PRN No."
  roll_number: ['roll_number','roll number','rollno','roll no','roll','rbt',
                'prn no','prn no.','prn','prn number',
                'enrollment','enroll no','enrollment no','registration no','reg no'],
  // Name — college uses "Candidate Name"
  name:        ['name','full name','fullname','student name','faculty name',
                'candidate name','candidatename','fname'],
  // Email — college uses "Official Email ID"
  email:       ['email','email id','email address','mail','college email',
                'official email','official email id','official emailid','e-mail','emailid'],
  // Sr No — ignored, just serial number
  sr_no:       ['sr no','sr no.','sr','s no','sno','serial no','serial number','#'],
  // Password (faculty bulk only)
  password:    ['password','pass','passwd','pwd','secret'],
};

const normalizeKey = (raw) => {
  // Strip punctuation like periods/dots, lowercase, trim
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9 _]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [canonical, variants] of Object.entries(COLUMN_MAP)) {
    if (variants.includes(cleaned)) return canonical;
  }
  return cleaned;
};

// ── Header detection — row must match at least 2 distinct columns ─
// Prevents false matches on single-cell rows like "Official Email ID of Students"
const HEADER_SIGNATURES = [
  { key: 'roll_number', hints: ['prn', 'roll', 'rbt', 'enrollment', 'reg'] },
  { key: 'name',        hints: ['name', 'candidate'] },
  { key: 'email',       hints: ['email', 'mail'] },
];

const isHeaderRow = (row) => {
  const vals = row.map(v => String(v || '').toLowerCase().trim());
  // Count how many distinct field signatures match any cell in this row
  const matches = HEADER_SIGNATURES.filter(sig =>
    sig.hints.some(hint => vals.some(v => v.includes(hint)))
  ).length;
  // Must match at least 2 signatures AND row must have at least 2 non-empty cells
  const nonEmpty = vals.filter(v => v !== '').length;
  return matches >= 2 && nonEmpty >= 2;
};

// ── File parser — CSV + XLSX + XLS ───────────────────────────────
// Handles files with college letterhead rows before actual data
const parseFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  const isCSV = file.name.toLowerCase().endsWith('.csv');

  reader.onload = (ev) => {
    try {
      let rawRows = [];

      if (isCSV) {
        const lines = ev.target.result.trim().split('\n').filter(Boolean);
        if (lines.length < 2) return resolve([]);
        // Find actual header line
        let headerIdx = 0;
        for (let i = 0; i < Math.min(lines.length, 15); i++) {
          if (isHeaderRow(lines[i].split(','))) { headerIdx = i; break; }
        }
        const headers = lines[headerIdx].split(',').map(h => normalizeKey(h.replace(/\r/g, '')));
        rawRows = lines.slice(headerIdx + 1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/\r/g, ''));
          const obj = {};
          headers.forEach((h, i) => { if (h) obj[h] = vals[i] || ''; });
          return obj;
        });
      } else {
        // For Excel — read all rows as 2D array, find header row manually
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Find the row index that contains actual column headers
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(allRows.length, 15); i++) {
          if (isHeaderRow(allRows[i])) { headerRowIdx = i; break; }
        }

        const headerRow = allRows[headerRowIdx];
        const headers = headerRow.map(h => normalizeKey(String(h)));

        // Stop at empty rows or footer rows (no PRN-like value in col 1)
        const dataRows = [];
        for (const row of allRows.slice(headerRowIdx + 1)) {
          const nonEmpty = row.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
          if (nonEmpty.length === 0) continue; // skip blank rows
          // If col1 (Sr No) is not a number, it's likely a footer — stop
          const col0 = String(row[0] ?? '').trim();
          if (col0 !== '' && isNaN(Number(col0))) break;
          const obj = {};
          headers.forEach((h, i) => {
            if (h && h !== 'sr_no') obj[h] = String(row[i] ?? '').trim();
          });
          dataRows.push(obj);
        }
        rawRows = dataRows;
      }

      // Filter out completely empty rows
      const rows = rawRows.filter(r => Object.values(r).some(v => v !== ''));
      resolve(rows);
    } catch (err) {
      reject(new Error('Failed to parse file: ' + err.message));
    }
  };

  reader.onerror = () => reject(new Error('Failed to read file'));

  if (isCSV) reader.readAsText(file);
  else reader.readAsBinaryString(file);
});

// ── Sub-components ────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Badge = ({ active }) => active
  ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100"><CheckCircle className="w-3 h-3" />Active</span>
  : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded-full border border-red-100"><XCircle className="w-3 h-3" />Inactive</span>;

// ── Modal wrapper ─────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ── Field component ───────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
);

// ══════════════════════════════════════════════════════════════════
// Main HOD Portal
// ══════════════════════════════════════════════════════════════════
export default function HODPortal() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchS, setSearchS] = useState('');
  const [searchF, setSearchF] = useState('');

  // modals
  const [modal, setModal] = useState(null); // 'addStudent' | 'addFaculty' | 'bulkStudent' | 'bulkFaculty'

  const api = authFetch(token);

  // ── Load data ──────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, f, st, w] = await Promise.all([
        api('/admin/students'),
        api('/admin/faculty'),
        api('/admin/stats'),
        api('/workshops'),
      ]);
      setStudents(s.students || []);
      setFaculty(f.faculty || []);
      setStats(st);
      setWorkshops(w.workshops || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Guard: super_admin only ────────────────────────────────────
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      toast.error('Access denied');
      navigate('/faculty/dashboard');
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  // ── Download HOD report ────────────────────────────────────────
  const downloadReport = async (workshopId, workshopId_str) => {
    try {
      const res = await fetch(`${API}/workshops/${workshopId}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${workshopId_str}_HOD_Report.docx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed'); }
  };

  // ── Toggle active status ───────────────────────────────────────
  const toggleStatus = async (type, id) => {
    try {
      await api(`/admin/${type}/${id}/toggle`, { method: 'PATCH' });
      toast.success('Status updated');
      loadAll();
    } catch (err) { toast.error(err.message); }
  };

  // ── Filtered lists ─────────────────────────────────────────────
  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchS.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchS.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchS.toLowerCase())
  );
  const filteredFaculty = faculty.filter(f =>
    f.name?.toLowerCase().includes(searchF.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchF.toLowerCase())
  );

  // ── CSV template download ──────────────────────────────────────
  const downloadTemplate = (type) => {
    const rows = type === 'student'
      ? [
          { roll_number: 'RBT23AR001', name: 'Student Name', email: 'student@jspmrscoe.edu.in', year: 2 },
          { roll_number: 'RBT23AR002', name: 'Another Student', email: 'student2@jspmrscoe.edu.in', year: 3 },
        ]
      : [
          { name: 'Faculty Name', email: 'faculty@jspmrscoe.edu.in', password: 'SecurePass123' },
          { name: 'Another Faculty', email: 'faculty2@jspmrscoe.edu.in', password: 'Pass456' },
        ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'student' ? 'Students' : 'Faculty');
    XLSX.writeFile(wb, `${type}_template.xlsx`);
  };

  // ── TABS ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'workshops', label: 'Workshops', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Nav ─────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-800 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-none">HOD Portal</p>
            <p className="text-xs text-slate-400">WorkShield — Super Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Tab Bar ─────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 shadow-sm w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-indigo-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════
                DASHBOARD TAB
            ══════════════════════════════════════════════════ */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={GraduationCap} label="Total Students" value={stats?.students?.total ?? '—'} sub={`${stats?.students?.active ?? 0} active`} color="bg-blue-600" />
                  <StatCard icon={Users} label="Total Faculty" value={stats?.faculty?.total ?? '—'} sub={`${stats?.faculty?.active ?? 0} active`} color="bg-indigo-600" />
                  <StatCard icon={BookOpen} label="Workshops" value={workshops.length} sub="All time" color="bg-violet-600" />
                  <StatCard icon={CheckCircle} label="Completed" value={workshops.filter(w => w.status === 'completed' || w.status === 'locked').length} sub="Locked / done" color="bg-emerald-600" />
                </div>

                {/* Recent workshops with download */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" />All Workshops</h2>
                    <button onClick={loadAll} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><RefreshCw className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  {workshops.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">No workshops yet</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {workshops.map(w => (
                        <div key={w._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{w.topic}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {w.workshop_id} • {w.date ? new Date(w.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                              {' • '}{w.speakers?.join(', ') || w.speaker || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.status === 'active' ? 'bg-emerald-50 text-emerald-700' : w.status === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                              {w.status}
                            </span>
                            <button onClick={() => downloadReport(w._id, w.workshop_id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-lg text-xs font-medium transition-colors">
                              <Download className="w-3 h-3" />Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STUDENTS TAB
            ══════════════════════════════════════════════════ */}
            {tab === 'students' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={searchS} onChange={e => setSearchS(e.target.value)}
                      placeholder="Search students..." className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadTemplate('student')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                      <FileSpreadsheet className="w-4 h-4" />CSV Template
                    </button>
                    <button onClick={() => setModal('bulkStudent')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors font-medium">
                      <Upload className="w-4 h-4" />Bulk Upload
                    </button>
                    <button onClick={() => setModal('addStudent')}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl transition-colors font-medium">
                      <Plus className="w-4 h-4" />Add Student
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-50">
                    <p className="text-sm text-slate-500">{filteredStudents.length} of {students.length} students</p>
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">No students found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll No</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Year</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStudents.map(s => (
                            <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-indigo-700 font-semibold">{s.roll_number}</td>
                              <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{s.email}</td>
                              <td className="px-4 py-3 text-slate-500">Year {s.year}</td>
                              <td className="px-4 py-3"><Badge active={s.is_active} /></td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => toggleStatus('students', s._id)}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                                  {s.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                FACULTY TAB
            ══════════════════════════════════════════════════ */}
            {tab === 'faculty' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={searchF} onChange={e => setSearchF(e.target.value)}
                      placeholder="Search faculty..." className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadTemplate('faculty')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                      <FileSpreadsheet className="w-4 h-4" />CSV Template
                    </button>
                    <button onClick={() => setModal('bulkFaculty')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors font-medium">
                      <Upload className="w-4 h-4" />Bulk Upload
                    </button>
                    <button onClick={() => setModal('addFaculty')}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl transition-colors font-medium">
                      <Plus className="w-4 h-4" />Add Faculty
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-50">
                    <p className="text-sm text-slate-500">{filteredFaculty.length} of {faculty.length} faculty members</p>
                  </div>
                  {filteredFaculty.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">No faculty found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredFaculty.map(f => (
                            <tr key={f._id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800">{f.name}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{f.email}</td>
                              <td className="px-4 py-3"><Badge active={f.is_active} /></td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => toggleStatus('faculty', f._id)}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${f.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                                  {f.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                WORKSHOPS TAB
            ══════════════════════════════════════════════════ */}
            {tab === 'workshops' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800 text-sm">{workshops.length} Total Workshops</h2>
                  <button onClick={loadAll} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                {workshops.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">No workshops yet</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {workshops.map(w => (
                      <div key={w._id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{w.topic}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            <span className="font-mono">{w.workshop_id}</span>
                            {' • '}{w.date ? new Date(w.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Speaker: {w.speakers?.join(', ') || w.speaker || 'N/A'}
                            {w.industry_name && ` • ${w.industry_name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${w.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : w.status === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {w.status}
                          </span>
                          <button onClick={() => downloadReport(w._id, w.workshop_id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-medium transition-colors">
                            <Download className="w-3.5 h-3.5" />HOD Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════ */}
      {modal === 'addStudent' && (
        <AddStudentModal api={api} onClose={() => setModal(null)} onDone={() => { setModal(null); loadAll(); }} />
      )}
      {modal === 'addFaculty' && (
        <AddFacultyModal api={api} onClose={() => setModal(null)} onDone={() => { setModal(null); loadAll(); }} />
      )}
      {modal === 'bulkStudent' && (
        <BulkUploadModal type="student" api={api} onClose={() => setModal(null)} onDone={() => { setModal(null); loadAll(); }} />
      )}
      {modal === 'bulkFaculty' && (
        <BulkUploadModal type="faculty" api={api} onClose={() => setModal(null)} onDone={() => { setModal(null); loadAll(); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Add Student Modal
// ══════════════════════════════════════════════════════════════════
function AddStudentModal({ api, onClose, onDone }) {
  const [form, setForm] = useState({ roll_number: '', name: '', email: '', year: '1' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.roll_number || !form.name || !form.email) return toast.error('All fields required');
    if (!form.email.endsWith('@jspmrscoe.edu.in')) return toast.error('Email must be @jspmrscoe.edu.in');
    setSaving(true);
    try {
      await api('/admin/students', { method: 'POST', body: JSON.stringify({ ...form, year: parseInt(form.year) }) });
      toast.success(`Student ${form.name} added! Password = ${form.roll_number.toUpperCase()}`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Student" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Roll Number" required>
          <Input placeholder="e.g. RBT23AR001" value={form.roll_number} onChange={e => set('roll_number', e.target.value.toUpperCase())} />
          <p className="text-xs text-slate-400 mt-1">This will also be the student's default password</p>
        </Field>
        <Field label="Full Name" required>
          <Input placeholder="Student's full name" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="College Email" required>
          <Input placeholder="student@jspmrscoe.edu.in" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Year">
          <select value={form.year} onChange={e => set('year', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {['1', '2', '3', '4'].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </Field>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Student will login using their college email and roll number as password. They can reset it later.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Student
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// Add Faculty Modal
// ══════════════════════════════════════════════════════════════════
function AddFacultyModal({ api, onClose, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    if (!form.email.endsWith('@jspmrscoe.edu.in')) return toast.error('Email must be @jspmrscoe.edu.in');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api('/admin/faculty', { method: 'POST', body: JSON.stringify(form) });
      toast.success(`Faculty ${form.name} added successfully`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Faculty Member" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Full Name" required>
          <Input placeholder="Faculty's full name" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="College Email" required>
          <Input placeholder="faculty@jspmrscoe.edu.in" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Password" required>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} placeholder="Set login password" value={form.password}
              onChange={e => set('password', e.target.value)}
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Share this password with the faculty member</p>
        </Field>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Faculty
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// Bulk Upload Modal — CSV + XLSX + XLS
// College format: Sr No | PRN No. | Candidate Name | Official Email ID
// Year is selected via dropdown before upload (not in file)
// ══════════════════════════════════════════════════════════════════
const YEAR_OPTIONS = [
  { value: '1', label: 'FY — First Year' },
  { value: '2', label: 'SY — Second Year' },
  { value: '3', label: 'TY — Third Year' },
  { value: '4', label: 'BY — Fourth Year' },
];

function BulkUploadModal({ type, api, onClose, onDone }) {
  const fileRef = useRef();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('1');
  const isStudent = type === 'student';

  // Strip sr_no and inject year into each student row
  const cleanRows = (parsed, year) =>
    parsed.map(({ sr_no, ...rest }) => ({
      ...rest,
      ...(isStudent ? { year } : {})
    }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseFile(file);
      setRows(parsed);
      setFileName(file.name);
      setResult(null);
      if (parsed.length === 0) toast.error('No data rows found — check your file format');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (rows.length === 0) return toast.error('No data to upload');
    if (isStudent && !selectedYear) return toast.error('Please select a year');
    setUploading(true);
    try {
      const prepared = cleanRows(rows, parseInt(selectedYear));
      const body = isStudent
        ? JSON.stringify({ students: prepared })
        : JSON.stringify({ faculty: prepared });
      const endpoint = isStudent ? '/admin/students/bulk' : '/admin/faculty/bulk';
      const res = await api(endpoint, { method: 'POST', body });
      setResult(res);
      if (res.added?.length > 0) toast.success(`${res.added.length} ${type}(s) added!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Drag-and-drop support
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile({ target: { files: [file] } });
  };

  // Preview columns — hide sr_no, show only meaningful ones
  const previewKeys = rows.length > 0
    ? Object.keys(rows[0]).filter(k => k !== 'sr_no')
    : [];

  return (
    <Modal title={`Bulk Upload ${isStudent ? 'Students' : 'Faculty'}`} onClose={onClose}>
      <div className="space-y-4">
        {!result ? (
          <>
            {/* Column format info */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-1">Expected columns in your file:</p>
              <code className="text-xs text-indigo-700">
                {isStudent
                  ? 'Sr No · PRN No. · Candidate Name · Official Email ID'
                  : 'Name · Official Email ID · Password'}
              </code>
              <p className="text-xs text-slate-400 mt-1.5">
                Accepted: <span className="font-medium text-slate-500">.csv · .xlsx · .xls</span>
                {isStudent && <span className="ml-2 text-amber-600 font-medium">· Year selected below</span>}
              </p>
            </div>

            {/* Year selector — students only */}
            {isStudent && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Which year are these students? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {YEAR_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setSelectedYear(opt.value)}
                      className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedYear === opt.value
                          ? 'bg-indigo-800 text-white border-indigo-800 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                      }`}>
                      {opt.value === '1' ? 'FY' : opt.value === '2' ? 'SY' : opt.value === '3' ? 'TY' : 'BY'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Selected: <span className="font-medium text-slate-600">{YEAR_OPTIONS.find(o => o.value === selectedYear)?.label}</span>
                  {' — '}all uploaded students will be tagged with this year
                </p>
              </div>
            )}

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              {parsing ? (
                <Loader2 className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              )}
              <p className="text-sm text-slate-600 font-medium">
                {parsing ? 'Parsing file...' : rows.length > 0 ? `✓ ${fileName}` : 'Click or drag & drop file here'}
              </p>
              {rows.length > 0
                ? <p className="text-xs text-emerald-600 mt-1 font-medium">{rows.length} students detected</p>
                : <p className="text-xs text-slate-400 mt-1">CSV, XLSX or XLS</p>
              }
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />

            {/* Preview table — shows only meaningful columns, not Sr No */}
            {rows.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                  <p className="text-xs font-semibold text-slate-500">Preview — first 5 rows</p>
                  {isStudent && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                      {YEAR_OPTIONS.find(o => o.value === selectedYear)?.label.split(' — ')[0]}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto max-h-40">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100">
                        {previewKeys.map(k => (
                          <th key={k} className="text-left px-3 py-2 text-slate-600 font-semibold whitespace-nowrap capitalize">
                            {k.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((r, i) => (
                        <tr key={i} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/60'}`}>
                          {previewKeys.map((k, j) => (
                            <td key={j} className="px-3 py-1.5 text-slate-700 whitespace-nowrap max-w-40 truncate">
                              {r[k]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 5 && (
                  <p className="text-xs text-slate-400 px-3 py-2 border-t border-slate-100">
                    + {rows.length - 5} more rows not shown
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleUpload} disabled={uploading || rows.length === 0 || parsing}
                className="flex-1 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {rows.length > 0 ? `Upload ${rows.length} ${isStudent ? YEAR_OPTIONS.find(o=>o.value===selectedYear)?.label.split(' — ')[0] : ''} records` : 'Upload'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <p className="text-xl font-bold text-emerald-700">{result.added?.length ?? 0}</p>
                <p className="text-xs text-emerald-600 font-medium">Added</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xl font-bold text-amber-700">{result.skipped?.length ?? 0}</p>
                <p className="text-xs text-amber-600 font-medium">Skipped</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <p className="text-xl font-bold text-red-700">{result.errors?.length ?? 0}</p>
                <p className="text-xs text-red-600 font-medium">Errors</p>
              </div>
            </div>
            {result.skipped?.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 max-h-24 overflow-y-auto border border-amber-100">
                <p className="text-xs font-semibold text-amber-700 mb-1">Skipped (already exist):</p>
                {result.skipped.map((s, i) => (
                  <p key={i} className="text-xs text-amber-600">{s.roll_number || s.email} — {s.reason}</p>
                ))}
              </div>
            )}
            {result.errors?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-3 max-h-24 overflow-y-auto border border-red-100">
                <p className="text-xs font-semibold text-red-700 mb-1">Errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e.reason}</p>
                ))}
              </div>
            )}
            <button onClick={onDone} className="w-full py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-sm font-medium transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}