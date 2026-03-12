import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { getAllWorkshops } from '../../api/workshop.api';
import { getAttendanceByWorkshop } from '../../api/attendance.api';
import { getFeedbackAnalytics } from '../../api/feedback.api';
import toast from 'react-hot-toast';
import XLSX from 'xlsx-js-style';
import {
  FileText, Download, BarChart2,
  BookOpen, Calendar, Users, Star, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Excel export (unchanged) ──────────────────────────────────────────────────
const generateExcel = (workshop, logs) => {
  const verifiedLogs = logs.filter(l => l.verified_status);
  if (!verifiedLogs.length) return false;

  const wb = XLSX.utils.book_new();
  const wsData = [];

  const deptStyle = { font: { name: 'Arial', bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F3864' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const titleStyle = { font: { name: 'Arial', bold: true, sz: 12, color: { rgb: '1F3864' } }, fill: { fgColor: { rgb: 'D6E4F0' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const infoStyle = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'left', vertical: 'center' } };
  const statsStyle = { font: { name: 'Arial', bold: true, sz: 10, color: { rgb: '375623' } }, fill: { fgColor: { rgb: 'E2EFDA' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const headerStyle = { font: { name: 'Arial', bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } } };
  const evenRowStyle = () => ({ font: { name: 'Arial', sz: 10 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: 'D0D0D0' } }, bottom: { style: 'thin', color: { rgb: 'D0D0D0' } }, left: { style: 'thin', color: { rgb: 'D0D0D0' } }, right: { style: 'thin', color: { rgb: 'D0D0D0' } } } });
  const oddRowStyle = () => ({ font: { name: 'Arial', sz: 10 }, fill: { fgColor: { rgb: 'F2F7FC' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: 'D0D0D0' } }, bottom: { style: 'thin', color: { rgb: 'D0D0D0' } }, left: { style: 'thin', color: { rgb: 'D0D0D0' } }, right: { style: 'thin', color: { rgb: 'D0D0D0' } } } });
  const verifiedStyle = { font: { name: 'Arial', bold: true, sz: 10, color: { rgb: '00B050' } }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: 'D0D0D0' } }, bottom: { style: 'thin', color: { rgb: 'D0D0D0' } }, left: { style: 'thin', color: { rgb: 'D0D0D0' } }, right: { style: 'thin', color: { rgb: 'D0D0D0' } } } };
  const footerStyle = { font: { name: 'Arial', italic: true, sz: 8, color: { rgb: '808080' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const noteStyle = { font: { name: 'Arial', bold: true, sz: 9, color: { rgb: 'FF0000' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const e = (s) => ({ v: '', s });

  const dateStr = workshop.date ? new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';

  wsData.push([{ v: "DEPARTMENT OF AUTOMATION & ROBOTICS — JSPM's RSCOE", s: deptStyle }, ...Array(9).fill(e(deptStyle))]);
  wsData.push([{ v: `Workshop: ${workshop.topic}`, s: titleStyle }, ...Array(9).fill(e(titleStyle))]);
  wsData.push([{ v: `Topic: ${workshop.topic}`, s: infoStyle }, ...Array(3).fill(e(infoStyle)), e(infoStyle), { v: `Speaker(s): ${workshop.speakers?.join(', ') || workshop.speaker || 'N/A'}`, s: infoStyle }, ...Array(4).fill(e(infoStyle))]);
  wsData.push([{ v: `Date: ${dateStr}`, s: infoStyle }, ...Array(3).fill(e(infoStyle)), e(infoStyle), { v: `Workshop ID: ${workshop.workshop_id}`, s: infoStyle }, ...Array(4).fill(e(infoStyle))]);
  wsData.push([{ v: `Total Verified Students: ${verifiedLogs.length}`, s: statsStyle }, ...Array(9).fill(e(statsStyle))]);
  wsData.push(Array(10).fill({ v: '' }));
  wsData.push(['Sr. No', 'Student Name', 'Roll Number', 'Year', 'Department', 'Entry Time', 'Exit Time', 'Duration (mins)', 'Verified', 'Signature'].map(h => ({ v: h, s: headerStyle })));

  verifiedLogs.forEach((log, index) => {
    const style = index % 2 === 0 ? evenRowStyle() : oddRowStyle();
    const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
    wsData.push([
      { v: index + 1, s: style },
      { v: log.student_id?.name || 'N/A', s: { ...style, alignment: { horizontal: 'left', vertical: 'center' } } },
      { v: log.student_id?.roll_number || 'N/A', s: style },
      { v: `Year ${log.student_id?.year || 'N/A'}`, s: style },
      { v: log.student_id?.department || 'N/A', s: style },
      { v: fmt(log.entry_time), s: style },
      { v: fmt(log.exit_time), s: style },
      { v: log.total_duration_minutes || 0, s: style },
      { v: '✓ Verified', s: verifiedStyle },
      { v: '', s: style }
    ]);
  });

  wsData.push([{ v: `Digitally validated via WorkShield QR System | Workshop ID: ${workshop.workshop_id} | Generated: ${new Date().toLocaleString('en-IN')}`, s: footerStyle }, ...Array(9).fill({ v: '' })]);
  wsData.push([{ v: 'Note: Students must sign in the Signature column upon verification of their attendance.', s: noteStyle }, ...Array(9).fill({ v: '' })]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 8 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 20 }];
  ws['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 8 }, { hpt: 20 }, ...verifiedLogs.map(() => ({ hpt: 18 })), { hpt: 16 }, { hpt: 16 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, { s: { r: 2, c: 5 }, e: { r: 2, c: 9 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, { s: { r: 3, c: 5 }, e: { r: 3, c: 9 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 9 } }, { s: { r: 5, c: 0 }, e: { r: 5, c: 9 } },
    { s: { r: wsData.length - 2, c: 0 }, e: { r: wsData.length - 2, c: 9 } },
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 9 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Sheet');
  XLSX.writeFile(wb, `attendance_${workshop.workshop_id}.xlsx`);
  return true;
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Reports() {
  const navigate = useNavigate();
  const [workshops, setWorkshops]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState('');
  const [exporting, setExporting]   = useState('');
  const [analytics, setAnalytics]   = useState({});
  const [showAll, setShowAll]       = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getAllWorkshops();
        const ws = [...(res.data.data.workshops || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setWorkshops(ws);
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
    loadData();
  }, []);

  // ── Download .docx report from backend ──────────────────────────────────────
  const handleReport = async (workshop) => {
    setGenerating(workshop._id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/workshops/${workshop._id}/report`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to generate report');

      const blob     = await response.blob();
      const url      = window.URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = `${workshop.workshop_id}_Report.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  // ── Excel export ─────────────────────────────────────────────────────────────
  const handleExcel = async (workshop) => {
    setExporting(workshop._id);
    try {
      const attRes = await getAttendanceByWorkshop(workshop._id);
      const data   = attRes.data?.data;
      const logs   = data?.logs || data?.attendance || data || [];
      const ok     = generateExcel(workshop, Array.isArray(logs) ? logs : []);
      if (ok) toast.success('Excel exported!');
      else    toast.error('No verified students found');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting('');
    }
  };

  const visibleWorkshops = showAll ? workshops : workshops.slice(0, 3);

  return (
    <FacultyLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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
            <button onClick={() => navigate('/faculty/create-workshop')}
              className="mt-4 px-4 py-2 bg-indigo-800 text-white rounded-xl text-sm font-medium">
              Create Workshop
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visibleWorkshops.map((w) => {
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
                            <p className="font-semibold text-slate-800">{w.topic}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {w.workshop_id} • {new Date(w.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                          w.status === 'active'    ? 'bg-emerald-50 text-emerald-700' :
                          w.status === 'locked'    ? 'bg-red-50 text-red-600' :
                          w.status === 'upcoming'  ? 'bg-blue-50 text-blue-700' :
                                                     'bg-slate-100 text-slate-600'
                        }`}>{w.status}</span>
                      </div>

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

                      <div className="mt-4 flex gap-3">
                        {/* Excel — unchanged */}
                        <button
                          onClick={() => handleExcel(w)}
                          disabled={exporting === w._id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                        >
                          {exporting === w._id
                            ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin"></div>
                            : <Download className="w-4 h-4" />}
                          Export Excel
                        </button>

                        {/* Report — now downloads .docx from backend */}
                        <button
                          onClick={() => handleReport(w)}
                          disabled={generating === w._id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                        >
                          {generating === w._id
                            ? <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin"></div>
                            : <FileText className="w-4 h-4" />}
                          Download Report (.docx)
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

            {workshops.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                {showAll
                  ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                  : <><ChevronDown className="w-4 h-4" /> Show {workshops.length - 3} More Workshops</>
                }
              </button>
            )}
          </>
        )}
      </div>
    </FacultyLayout>
  );
}