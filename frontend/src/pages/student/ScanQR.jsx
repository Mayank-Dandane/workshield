import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { scanQR } from '../../api/attendance.api';
import toast from 'react-hot-toast';
import {
  QrCode, CheckCircle, XCircle,
  AlertCircle, ArrowLeft, Loader
} from 'lucide-react';

export default function ScanQR() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const workshopId = searchParams.get('workshop');

  console.log('ScanQR loaded');
  console.log('token:', token);
  console.log('workshopId:', workshopId);

  useEffect(() => {
    if (token && workshopId) {
      handleScan(token, workshopId);
    }
  }, []);

  const handleScan = async (t, w) => {
    setLoading(true);
    setStatus('scanning');
    try {
      const res = await scanQR({ token: t, workshop_id: w });
      const data = res.data.data;
      setResult(data);
      setStatus('success');
      toast.success(res.data.message);
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed';
      setResult({ message: msg });
      setStatus('error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Scan QR Code</h1>
            <p className="text-sm text-slate-500">Mark your workshop attendance</p>
          </div>
        </div>

        {/* Idle — no token */}
        {status === 'idle' && !token && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-10 h-10 text-blue-700" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Ready to Scan</h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Open your camera app and scan the QR code displayed on the projector screen.
              The link will automatically open this page and record your attendance.
            </p>
            <div className="mt-6 bg-blue-50 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">How it works</p>
              {[
                'Faculty displays QR on projector',
                'Open your camera app & scan QR',
                'Browser opens automatically',
                'Attendance recorded instantly ✅'
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-800">
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanning */}
        {status === 'scanning' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Loader className="w-10 h-10 text-blue-700 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Processing...</h2>
            <p className="text-slate-500 text-sm mt-2">Validating your QR code</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && result && (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              {result.type === 'entry' ? '✅ Entry Recorded!' :
               result.type === 'exit' ? '✅ Exit Recorded!' :
               '✅ Check Passed!'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">{result.message}</p>

            {result.type === 'exit' && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-800">{result.duration_minutes} mins</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-semibold ${result.verified_status ? 'text-emerald-600' : 'text-amber-500'}`}>
                           {result.verified_status ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex-1 py-2.5 bg-blue-800 text-white rounded-xl text-sm font-medium hover:bg-blue-900 transition-colors"
              >
                Go to Dashboard
              </button>
              {result.verified_status && (
  <button
    onClick={() => navigate('/student/feedback')}
    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
  >
    Submit Feedback
  </button>
)}
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Scan Failed</h2>
            <p className="text-slate-500 text-sm mt-2">{result?.message}</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="mt-6 w-full py-2.5 bg-blue-800 text-white rounded-xl text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Remember!</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Scan both Entry QR at start and Exit QR at end to get your attendance verified.
            </p>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}