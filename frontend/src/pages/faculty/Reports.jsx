import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { getAllWorkshops } from '../../api/workshop.api';
import { exportAttendanceExcel, getAttendanceByWorkshop } from '../../api/attendance.api';
import { getFeedbackAnalytics } from '../../api/feedback.api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  FileText, Download, BarChart2,
  BookOpen, Calendar, Users, Star
} from 'lucide-react';
import * as XLSX from 'xlsx';

const generateReportPDF = (workshop, attendanceLogs, feedbackStats) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(26, 58, 107);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFontSize(16).setTextColor(255, 255, 255).setFont('helvetica', 'bold');
  doc.text('WORKSHOP REPORT', W / 2, 12, { align: 'center' });
  doc.setFontSize(8).setFont('helvetica', 'normal');
  doc.text("JSPM's RSCOE — Dept. of Automation & Robotics", W / 2, 20, { align: 'center' });
  doc.setFontSize(7).setTextColor(170, 196, 232);
  doc.text(`Workshop ID: ${workshop.workshop_id}   |   Generated: ${new Date().toLocaleString('en-IN')}`, W / 2, 25, { align: 'center' });

  let y = 35;

  // Section helper
  const sectionTitle = (title) => {
    doc.setFontSize(11).setTextColor(26, 58, 107).setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    y += 4;
    doc.setDrawColor(26, 58, 107).setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    y += 6;
  };

  const row = (label, value, alt) => {
    if (alt) { doc.setFillColor(245, 247, 250); doc.rect(14, y - 4, W - 28, 7, 'F'); }
    doc.setFontSize(8.5).setTextColor(60, 60, 60).setFont('helvetica', 'bold');
    doc.text(label + ':', 16, y);
    doc.setFont('helvetica', 'normal').setTextColor(80, 80, 80);
    doc.text(String(value || 'N/A'), 65, y);
    y += 7;
  };

  // Workshop Details
  sectionTitle('SECTION 1 — WORKSHOP DETAILS');
  row('Workshop ID', workshop.workshop_id, false);
  row('Title', workshop.title, true);
  row('Topic', workshop.topic, false);
  row('Speaker', workshop.speaker, true);
  row('Date', new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), false);
  row('Time', `${workshop.start_time} - ${workshop.end_time}`, true);
  row('Min Duration', `${workshop.min_duration_minutes} minutes`, false);
  row('Random Check', workshop.random_check_enabled ? 'Enabled' : 'Disabled', true);
  y += 6;

  // Attendance Stats
  sectionTitle('SECTION 2 — ATTENDANCE SUMMARY');
  const verified = attendanceLogs.filter(l => l.verified_status).length;
  const total = attendanceLogs.length;
  const avgDur = total > 0
    ? Math.round(attendanceLogs.filter(l => l.total_duration_minutes).reduce((s, l) => s + (l.total_duration_minutes || 0), 0) / total)
    : 0;
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;

  row('Total Scanned', total, false);
  row('Total Verified', verified, true);
  row('Attendance Rate', `${pct}%`, false);
  row('Average Duration', `${avgDur} mins`, true);
  row('No Exit Scanned', attendanceLogs.filter(l => !l.exit_time).length, false);
  y += 6;

  // Feedback
  sectionTitle('SECTION 3 — FEEDBACK ANALYSIS');
  row('Total Submissions', feedbackStats?.total_submissions || 0, false);
  row('Overall Average', `${feedbackStats?.overall_average || 0} / 5`, true);
  y += 3;

  if (feedbackStats?.per_question?.length) {
    doc.autoTable({
      startY: y,
      head: [['Question', 'Avg Score', 'Responses']],
      body: feedbackStats.per_question.map(q => [q.question, `${q.average}/5`, q.total_responses]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [26, 58, 107], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Attendance list — new page
  if (attendanceLogs.length > 0) {
    doc.addPage();
    y = 15;
    doc.setFontSize(11).setTextColor(26, 58, 107).setFont('helvetica', 'bold');
    doc.text('SECTION 4 — FULL ATTENDANCE RECORD', 14, y);
    y += 5;
    doc.setDrawColor(26, 58, 107).setLineWidth(0.5).line(14, y, W - 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['#', 'Name', 'Roll No', 'Year', 'Entry', 'Exit', 'Duration', 'Status']],
      body: attendanceLogs.map((log, i) => [
        i + 1,
        log.student_id?.name || 'N/A',
        log.student_id?.roll_number || 'N/A',
        `Year ${log.student_id?.year || 'N/A'}`,
        log.entry_time ? new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        log.exit_time ? new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        `${log.total_duration_minutes || 0} mins`,
        log.verified_status ? 'Verified' : 'Not Verified'
      ]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [26, 58, 107], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        7: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Verified' ? [0, 165, 80] : [204, 0, 0];
        }
      },
      margin: { left: 14, right: 14 }
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7).setTextColor(160, 160, 160).setFont('helvetica', 'normal');
    doc.text(`Generated by WorkShield | Page ${i} of ${pageCount}`, W / 2, 290, { align: 'center' });
  }

  doc.save(`report_${workshop.workshop_id}.pdf`);
};

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

  const handleReport = async (workshop) => {
    setGenerating(workshop._id);
    try {
      const attRes = await getAttendanceByWorkshop(workshop._id);
      const logs = attRes.data.data.logs || [];
      const feedbackStats = analytics[workshop._id] || {};
      generateReportPDF(workshop, logs, feedbackStats);
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
      const res = await getAttendanceByWorkshop(workshopId);
      const logs = res.data.data.logs || [];
      const verifiedLogs = logs.filter(l => l.verified_status);
  
      if (!verifiedLogs.length) {
        toast.error('No verified students found');
        return;
      }
  
      const workshop = workshops.find(w => w._id === workshopId);
  
      // Build data
      const data = verifiedLogs.map((log, i) => ({
        'Sr. No': i + 1,
        'Student Name': log.student_id?.name || 'N/A',
        'Roll Number': log.student_id?.roll_number || 'N/A',
        'Year': `Year ${log.student_id?.year || 'N/A'}`,
        'Department': log.student_id?.department || 'N/A',
        'Entry Time': log.entry_time ? new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
        'Exit Time': log.exit_time ? new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
        'Duration (mins)': log.total_duration_minutes || 0,
        'Verified': '✓ Verified',
        'Signature': ''
      }));
  
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Sheet');
  
      // Column widths
      ws['!cols'] = [
        { wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 8 },
        { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
        { wch: 12 }, { wch: 20 }
      ];
  
      XLSX.writeFile(wb, `attendance_${workshopCode}.xlsx`);
      toast.success('Excel exported!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting('');
    }
  };

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
                      <button
                        onClick={() => handleExcel(w._id, w.workshop_id)}
                        disabled={exporting === w._id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                      >
                        {exporting === w._id
                          ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin"></div>
                          : <Download className="w-4 h-4" />}
                        Export Excel
                      </button>
                      <button
                        onClick={() => handleReport(w)}
                        disabled={generating === w._id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                      >
                        {generating === w._id
                          ? <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin"></div>
                          : <FileText className="w-4 h-4" />}
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