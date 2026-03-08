import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { generateQR, getAttendanceByWorkshop, lockAttendance, exportAttendanceExcel } from '../../api/attendance.api';
import { generateReport } from '../../api/report.api';
import { getWorkshopById, updateWorkshopStatus } from '../../api/workshop.api';
import toast from 'react-hot-toast';
import {
    Radio, RefreshCw, Users, CheckCircle,
    Lock, Download, FileText, Clock,
    QrCode, ArrowLeft, XCircle
  } from 'lucide-react';

const QR_ROTATION = 25; // seconds

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

  // ── Fetch workshop ─────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, [workshopId]);

  // ── Generate QR ────────────────────────────────────────────
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

  // ── Auto rotate QR every 25 seconds ───────────────────────
  useEffect(() => {
    if (!workshop || workshop.status !== 'active') return;
    fetchQR(qrType);

    const rotateInterval = setInterval(() => {
      fetchQR(qrType);
    }, QR_ROTATION * 1000);

    return () => clearInterval(rotateInterval);
  }, [workshop, qrType]);

  // ── Countdown timer ────────────────────────────────────────
  useEffect(() => {
    if (!qrData) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return QR_ROTATION;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrData]);

  // ── Refresh attendance every 10 seconds ───────────────────
  useEffect(() => {
    if (!workshopId) return;
    const fetchAtt = async () => {
      try {
        const res = await getAttendanceByWorkshop(workshopId);
        setAttendance(res.data.data.logs || []);
      } catch (err) { }
    };
    fetchAtt();
    const interval = setInterval(fetchAtt, 10000);
    return () => clearInterval(interval);
  }, [workshopId]);

  const handleTypeChange = (type) => {
    setQrType(type);
    fetchQR(type);
  };

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
      const res = await exportAttendanceExcel(workshopId);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${workshop?.workshop_id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleReport = async () => {
    setReporting(true);
    try {
      const res = await generateReport(workshopId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${workshop?.workshop_id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
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

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/faculty/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{workshop?.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  workshop?.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <Radio className="w-3 h-3" />
                  {workshop?.status}
                </span>
                <span className="text-xs text-slate-400">{workshop?.workshop_id}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
            >
              {exporting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                : <Download className="w-4 h-4" />
              }
              Excel
            </button>
            <button
              onClick={handleReport}
              disabled={reporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
            >
              {reporting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                : <FileText className="w-4 h-4" />
              }
              Report
            </button>
            {workshop?.status === 'active' && (
              <button
                onClick={handleLock}
                disabled={locking}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
              >
                <Lock className="w-4 h-4" />
                Lock
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── QR Display ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Live QR Code</h2>
                </div>
                <button
                  onClick={() => fetchQR(qrType)}
                  disabled={qrLoading}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-500 ${qrLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* QR Type selector */}
              <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
                {['entry', 'exit', 'random'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                      qrType === type
                        ? 'bg-white text-indigo-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* QR Image */}
              {workshop?.status !== 'active' ? (
                <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                  <Lock className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm font-medium">Workshop not active</p>
                  <p className="text-slate-400 text-xs mt-1">Activate workshop to show QR</p>
                </div>
              ) : qrLoading && !qrData ? (
                <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-800"></div>
                </div>
              ) : qrData ? (
                <div className="text-center">
                  <div className="relative inline-block">
                    <img
                      src={qrData.qr_image}
                      alt="QR Code"
                      className="w-full max-w-xs mx-auto rounded-2xl shadow-sm"
                    />
                    {/* Timer ring overlay */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-slate-100 rounded-full px-3 py-1 shadow-sm flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'text-red-500' : 'text-indigo-600'}`} />
                      <span className={`text-xs font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-indigo-700'}`}>
                        {timeLeft}s
                      </span>
                    </div>
                  </div>

                  {/* Timer bar */}
                  <div className="mt-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        timeLeft <= 5 ? 'bg-red-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${timerPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
  Rotates every {QR_ROTATION} seconds • {qrType.toUpperCase()} QR
</p>


                </div>
              ) : null}
            </div>
          </div>

          {/* ── Live Attendance ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Live Attendance</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Live
                </div>
              </div>
            </div>

            {/* Stats */}
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

            {/* Student list */}
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
                        <p className="text-sm font-medium text-slate-800">
                          {log.student_id?.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {log.student_id?.roll_number}
                          {log.entry_time && ` • In: ${new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                          {log.exit_time && ` • Out: ${new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      {log.verified_status
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        : <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      }
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