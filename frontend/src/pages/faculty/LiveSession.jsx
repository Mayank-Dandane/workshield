import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { generateQR, getAttendanceByWorkshop, lockAttendance } from '../../api/attendance.api';
import { getWorkshopById } from '../../api/workshop.api';
import { getFeedbackAnalytics } from '../../api/feedback.api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import {
  Radio, RefreshCw, Users, CheckCircle,
  Lock, Download, FileText, Clock,
  QrCode, ArrowLeft
} from 'lucide-react';

const QR_ROTATION = 25;

const generateReportPDF = (workshop, attendanceLogs, feedbackStats) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(26, 58, 107);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFontSize(16).setTextColor(255, 255, 255).setFont('helvetica', 'bold');
  doc.text('WORKSHOP REPORT', W / 2, 12, { align: 'center' });
  doc.setFontSize(8).setFont('helvetica', 'normal');
  doc.text("JSPM's RSCOE - Dept. of Automation & Robotics", W / 2, 20, { align: 'center' });
  doc.setFontSize(7).setTextColor(170, 196, 232);
  doc.text('Workshop ID: ' + workshop.workshop_id + '   |   Generated: ' + new Date().toLocaleString('en-IN'), W / 2, 25, { align: 'center' });

  doc.setFontSize(11).setTextColor(26, 58, 107).setFont('helvetica', 'bold');
  doc.text('SECTION 1 - WORKSHOP DETAILS', 14, 38);
  doc.setDrawColor(26, 58, 107).setLineWidth(0.5).line(14, 41, W - 14, 41);

  const details = [
    ['Workshop ID', workshop.workshop_id || 'N/A'],
    ['Title', workshop.title || 'N/A'],
    ['Topic', workshop.topic || 'N/A'],
    ['Speaker', workshop.speaker || 'N/A'],
    ['Date', workshop.date ? new Date(workshop.date).toLocaleDateString('en-IN') : 'N/A'],
    ['Time', (workshop.start_time || '') + ' - ' + (workshop.end_time || '')],
    ['Min Duration', (workshop.min_duration_minutes || 0) + ' minutes'],
  ];

  let y = 48;
  details.forEach(([k, v]) => {
    doc.setFontSize(9).setTextColor(60, 60, 60).setFont('helvetica', 'bold').text(k + ':', 16, y);
    doc.setFont('helvetica', 'normal').setTextColor(80, 80, 80).text(String(v), 65, y);
    y += 8;
  });

  y += 4;
  doc.setFontSize(11).setTextColor(26, 58, 107).setFont('helvetica', 'bold');
  doc.text('SECTION 2 - ATTENDANCE SUMMARY', 14, y);
  y += 3;
  doc.setDrawColor(26, 58, 107).setLineWidth(0.5).line(14, y, W - 14, y);
  y += 7;

  const verifiedCount = attendanceLogs.filter(l => l.verified_status).length;
  const total = attendanceLogs.length;
  const pct = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;
  const avgDur = total > 0 ? Math.round(attendanceLogs.reduce((s, l) => s + (l.total_duration_minutes || 0), 0) / total) : 0;

  [['Total Scanned', total], ['Total Verified', verifiedCount], ['Attendance Rate', pct + '%'], ['Average Duration', avgDur + ' mins']].forEach(([k, v]) => {
    doc.setFontSize(9).setTextColor(60, 60, 60).setFont('helvetica', 'bold').text(k + ':', 16, y);
    doc.setFont('helvetica', 'normal').setTextColor(80, 80, 80).text(String(v), 65, y);
    y += 8;
  });

  y += 4;
  doc.setFontSize(11).setTextColor(26, 58, 107).setFont('helvetica', 'bold');
  doc.text('SECTION 3 - FEEDBACK ANALYSIS', 14, y);
  y += 3;
  doc.setDrawColor(26, 58, 107).setLineWidth(0.5).line(14, y, W - 14, y);
  y += 7;

  doc.setFontSize(9).setTextColor(60, 60, 60).setFont('helvetica', 'bold').text('Total Submissions:', 16, y);
  doc.setFont('helvetica', 'normal').setTextColor(80, 80, 80).text(String(feedbackStats?.total_submissions || 0), 65, y);
  y += 8;
  doc.setFontSize(9).setTextColor(60, 60, 60).setFont('helvetica', 'bold').text('Overall Average:', 16, y);
  doc.setFont('helvetica', 'normal').setTextColor(80, 80, 80).text((feedbackStats?.overall_average || 0) + ' / 5', 65, y);
  y += 8;

  if (feedbackStats?.per_question?.length) {
    autoTable(doc, {
      startY: y + 4,
      head: [['Question', 'Avg Score', 'Responses']],
      body: feedbackStats.per_question.map(q => [q.question || '', (q.average || 0) + '/5', q.total_responses || 0]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [26, 58, 107], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 }
    });
  }

  if (attendanceLogs.length > 0) {
    doc.addPage();
    doc.setFontSize(11).setTextColor(26, 58, 107).setFont('helvetica', 'bold');
    doc.text('SECTION 4 - FULL ATTENDANCE RECORD', 14, 20);
    doc.setDrawColor(26, 58, 107).setLineWidth(0.5).line(14, 23, W - 14, 23);
    autoTable(doc, {
      startY: 28,
      head: [['#', 'Name', 'Roll No', 'Entry', 'Exit', 'Duration', 'Status']],
      body: attendanceLogs.map((log, i) => [
        i + 1,
        log.student_id?.name || 'N/A',
        log.student_id?.roll_number || 'N/A',
        log.entry_time ? new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        log.exit_time ? new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        (log.total_duration_minutes || 0) + ' mins',
        log.verified_status ? 'Verified' : 'Not Verified'
      ]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [26, 58, 107], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Verified' ? [0, 165, 80] : [204, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 }
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7).setTextColor(160, 160, 160).setFont('helvetica', 'normal');
    doc.text('Generated by WorkShield | Page ' + i + ' of ' + pageCount, W / 2, 290, { align: 'center' });
  }
  doc.save('report_' + workshop.workshop_id + '.pdf');
};

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
  const empty = (s) => ({ v: '', s });

  const dateStr = workshop.date ? new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';

  wsData.push([{ v: "DEPARTMENT OF AUTOMATION & ROBOTICS — JSPM's RSCOE", s: deptStyle }, ...Array(9).fill(empty(deptStyle))]);
  wsData.push([{ v: `Workshop: ${workshop.title}`, s: titleStyle }, ...Array(9).fill(empty(titleStyle))]);
  wsData.push([{ v: `Topic: ${workshop.topic}`, s: infoStyle }, ...Array(3).fill(empty(infoStyle)), empty(infoStyle), { v: `Speaker: ${workshop.speaker}`, s: infoStyle }, ...Array(4).fill(empty(infoStyle))]);
  wsData.push([{ v: `Date: ${dateStr}`, s: infoStyle }, ...Array(3).fill(empty(infoStyle)), empty(infoStyle), { v: `Workshop ID: ${workshop.workshop_id}`, s: infoStyle }, ...Array(4).fill(empty(infoStyle))]);
  wsData.push([{ v: `Total Verified Students: ${verifiedLogs.length}`, s: statsStyle }, ...Array(9).fill(empty(statsStyle))]);
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

export default function LiveSession() {
  const { workshopId } = useParams();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [qrType, setQrType] = useState('entry');
  const [timeLeft, setTimeLeft] = useState(QR_ROTATION);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getWorkshopById(workshopId);
        setWorkshop(res.data.data.workshop);
      } catch (err) {
        toast.error('Workshop not found');
        navigate('/faculty/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workshopId]);

  const fetchQR = useCallback(async (type = qrType) => {
    if (!workshopId) return;
    setQrLoading(true);
    try {
      const res = await generateQR(workshopId, type);
      setQrData(res.data.data);
      setTimeLeft(QR_ROTATION);
    } catch (err) {
      console.error('QR generation failed:', err);
    } finally {
      setQrLoading(false);
    }
  }, [workshopId, qrType]);

  useEffect(() => {
    if (!workshop || workshop.status !== 'active') return;
    fetchQR(qrType);
    const rotateInterval = setInterval(() => fetchQR(qrType), QR_ROTATION * 1000);
    return () => clearInterval(rotateInterval);
  }, [workshop, qrType]);

  useEffect(() => {
    if (!qrData) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev <= 1 ? QR_ROTATION : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [qrData]);

  useEffect(() => {
    if (!workshopId) return;
    const fetchAtt = async () => {
      try {
        const res = await getAttendanceByWorkshop(workshopId);
        setAttendance(res.data.data.logs || []);
      } catch (err) {}
    };
    fetchAtt();
    const interval = setInterval(fetchAtt, 10000);
    return () => clearInterval(interval);
  }, [workshopId]);

  const handleTypeChange = (type) => { setQrType(type); fetchQR(type); };

  const handleLock = async () => {
    setLocking(true);
    try {
      await lockAttendance(workshopId);
      toast.success('Attendance locked!');
      const res = await getWorkshopById(workshopId);
      setWorkshop(res.data.data.workshop);
    } catch (err) {
      toast.error('Failed to lock attendance');
    } finally {
      setLocking(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await getAttendanceByWorkshop(workshopId);
      const data = res.data?.data;
      const logs = data?.logs || data?.attendance || data || [];
      const ok = generateExcel(workshop, Array.isArray(logs) ? logs : []);
      if (ok) toast.success('Excel exported!');
      else toast.error('No verified students found');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleReport = async () => {
    setReporting(true);
    try {
      const attRes = await getAttendanceByWorkshop(workshopId);
      const data = attRes.data?.data;
      const logs = data?.logs || data?.attendance || data || [];
      let feedbackStats = {};
      try {
        const feedRes = await getFeedbackAnalytics(workshopId);
        feedbackStats = feedRes.data.data || {};
      } catch (e) {}
      generateReportPDF(workshop, Array.isArray(logs) ? logs : [], feedbackStats);
      toast.success('Report generated!');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setReporting(false);
    }
  };

  const verified = attendance.filter(a => a.verified_status).length;
  const timerPct = (timeLeft / QR_ROTATION) * 100;

  if (loading) return (
    <FacultyLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-800"></div>
      </div>
    </FacultyLayout>
  );

  return (
    <FacultyLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/faculty/dashboard')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{workshop?.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${workshop?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  <Radio className="w-3 h-3" />{workshop?.status}
                </span>
                <span className="text-xs text-slate-400">{workshop?.workshop_id}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportExcel} disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70">
              {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
              Excel
            </button>
            <button onClick={handleReport} disabled={reporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70">
              {reporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FileText className="w-4 h-4" />}
              Report
            </button>
            {workshop?.status === 'active' && (
              <button onClick={handleLock} disabled={locking}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70">
                <Lock className="w-4 h-4" />Lock
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Live QR Code</h2>
                </div>
                <button onClick={() => fetchQR(qrType)} disabled={qrLoading} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <RefreshCw className={`w-4 h-4 text-slate-500 ${qrLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
                {['entry', 'exit', 'random'].map((type) => (
                  <button key={type} onClick={() => handleTypeChange(type)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${qrType === type ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {type}
                  </button>
                ))}
              </div>
              {workshop?.status !== 'active' ? (
                <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                  <Lock className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm font-medium">Workshop not active</p>
                </div>
              ) : qrLoading && !qrData ? (
                <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-800"></div>
                </div>
              ) : qrData ? (
                <div className="text-center">
                  <div className="relative inline-block">
                    <img src={qrData.qr_image} alt="QR Code" className="w-full max-w-xs mx-auto rounded-2xl shadow-sm" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-slate-100 rounded-full px-3 py-1 shadow-sm flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'text-red-500' : 'text-indigo-600'}`} />
                      <span className={`text-xs font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-indigo-700'}`}>{timeLeft}s</span>
                    </div>
                  </div>
                  <div className="mt-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${timerPct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Rotates every {QR_ROTATION} seconds • {qrType.toUpperCase()} QR</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Live Attendance</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>Live
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-50">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-800">{attendance.length}</p>
                <p className="text-xs text-slate-400">Scanned</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600">{verified}</p>
                <p className="text-xs text-slate-400">Verified</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber-600">{attendance.length - verified}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
            <div className="overflow-auto max-h-80">
              {attendance.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Waiting for students to scan...</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {attendance.map((log) => (
                    <div key={log._id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{log.student_id?.name}</p>
                        <p className="text-xs text-slate-400">
                          {log.student_id?.roll_number}
                          {log.entry_time && ` • In: ${new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                          {log.exit_time && ` • Out: ${new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      {log.verified_status
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        : <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}