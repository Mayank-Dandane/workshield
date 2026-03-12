import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { verifyCertificate } from '../api/certificate.api';
import {
  CheckCircle, XCircle, Award, BookOpen,
  Calendar, User, Hash
} from 'lucide-react';

export default function VerifyCertificate() {
  const { certificateId } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await verifyCertificate(certificateId);
        setResult({ valid: true, ...res.data.data });
      } catch (err) {
        setResult({ valid: false, message: err.response?.data?.message || 'Certificate not found' });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-800 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">WorkShield</p>
              <p className="text-xs text-slate-400">Certificate Verification</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            JSPM's RSCOE — Dept. of Automation & Robotics
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800 mx-auto mb-4"></div>
              <p className="text-slate-500">Verifying certificate...</p>
            </div>

          ) : result?.valid ? (
            <div className="space-y-4">

              {/* Valid banner */}
              <div className="bg-emerald-500 rounded-2xl p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-9 h-9 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Certificate Valid ✅</h1>
                <p className="text-emerald-100 text-sm mt-1">
                  This certificate has been verified and is authentic
                </p>
              </div>

              {/* Certificate details */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Certificate Details</h2>
                </div>
                <div className="p-5 space-y-4">

                  {/* Certificate ID */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Hash className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Certificate ID</p>
                      <p className="font-semibold text-slate-800 text-sm mt-0.5">
                        {result.certificate_id}
                      </p>
                    </div>
                  </div>

                  {/* Student */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Issued To</p>
                      <p className="font-semibold text-slate-800 text-sm mt-0.5">
                        {result.student?.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {result.student?.roll_number} — {result.student?.department} — Year {result.student?.year}
                      </p>
                    </div>
                  </div>

                  {/* Workshop */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-violet-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Workshop</p>
                      {/* ✅ topic is now the main heading; speakers on subtitle */}
                      <p className="font-semibold text-slate-800 text-sm mt-0.5">
                        {result.workshop?.topic}
                      </p>
                      <p className="text-xs text-slate-400">
                        by {result.workshop?.speakers?.join(', ') || result.workshop?.speaker}
                      </p>
                    </div>
                  </div>

                  {/* Workshop Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Workshop Date</p>
                      <p className="font-semibold text-slate-800 text-sm mt-0.5">
                        {result.workshop?.date
                          ? new Date(result.workshop.date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Issue Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Issue Date</p>
                      <p className="font-semibold text-slate-800 text-sm mt-0.5">
                        {result.issued_on
                          ? new Date(result.issued_on).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-slate-400 mb-1">Verification Status</p>
                    <p className="text-sm font-semibold text-emerald-600">{result.status}</p>
                  </div>

                </div>
              </div>

              {/* Footer note */}
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Digitally verified by WorkShield QR System •{' '}
                  JSPM's RSCOE, Dept. of Automation & Robotics
                </p>
              </div>
            </div>

          ) : (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Certificate Invalid ❌</h1>
              <p className="text-slate-500 text-sm mt-2">{result?.message}</p>
              <p className="text-slate-400 text-xs mt-4">
                This certificate could not be verified. It may be fake or revoked.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-100 bg-white">
        © 2026 WorkShield — JSPM's RSCOE | Dept. of Automation & Robotics
      </footer>

    </div>
  );
}