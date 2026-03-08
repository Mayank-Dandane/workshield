import { useState, useEffect } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import { getMyCertificates, generateCertificate, downloadCertificate } from '../../api/certificate.api';
import { getMyAttendance } from '../../api/attendance.api';
import { getMyFeedback } from '../../api/feedback.api';
import toast from 'react-hot-toast';
import { Award, Download, CheckCircle, Lock, ExternalLink } from 'lucide-react';

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [eligibleWorkshops, setEligibleWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certRes, attRes, feedRes] = await Promise.all([
        getMyCertificates(),
        getMyAttendance(),
        getMyFeedback()
      ]);

      const certs = certRes.data.data.certificates || [];
      const logs = attRes.data.data.logs || [];
      const feedbacks = feedRes.data.data.feedbacks || [];

      setCertificates(certs);

      // Find eligible workshops (verified + feedback submitted + no cert yet)
      const certWorkshopIds = certs.map(c => c.workshop_id?._id);
      const eligible = logs.filter(log =>
        log.verified_status &&
        feedbacks.some(f => f.workshop_id?._id === log.workshop_id?._id) &&
        !certWorkshopIds.includes(log.workshop_id?._id)
      );

      setEligibleWorkshops(eligible);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (workshopId) => {
    setGenerating(workshopId);
    try {
      await generateCertificate(workshopId);
      toast.success('🎉 Certificate generated!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating('');
    }
  };

  const handleDownload = async (certId) => {
    try {
      setDownloading(certId);
      const res = await generateCertificate({ workshop_id: workshops.find(w => 
        certificates.find(c => c.certificate_id === certId)?.workshop_id?._id === w._id
      )?._id });
      const base64 = res.data.data?.pdf_base64;
      if (base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${base64}`;
        link.download = `certificate_${certId}.pdf`;
        link.click();
        toast.success('Certificate downloaded!');
      }
    } catch (err) {
      toast.error('Failed to download certificate');
    } finally {
      setDownloading('');
    }
  };
  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800"></div>
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Certificates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Download your workshop participation certificates</p>
        </div>

        {/* Eligible to generate */}
        {eligibleWorkshops.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-50 bg-amber-50 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-amber-800 text-sm">
                Ready to Generate ({eligibleWorkshops.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {eligibleWorkshops.map((log) => (
                <div key={log._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {log.workshop_id?.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {log.workshop_id?.date
                          ? new Date(log.workshop_id.date).toLocaleDateString('en-IN')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerate(log.workshop_id?._id)}
                    disabled={generating === log.workshop_id?._id}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2 flex-shrink-0"
                  >
                    {generating === log.workshop_id?._id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Award className="w-4 h-4" />
                    )}
                    Generate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated certificates */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-slate-800 text-sm">
              My Certificates ({certificates.length})
            </h2>
          </div>

          {certificates.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No certificates yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Complete attendance + feedback to earn certificates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {certificates.map((cert) => (
                <div key={cert._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {cert.workshop_id?.title || 'Workshop'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ID: {cert.certificate_id} • Issued {new Date(cert.issue_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/verify/${cert.certificate_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Verify Certificate"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </a>
                    <button
                      onClick={() => handleDownload(cert.certificate_id)}
                      disabled={downloading === cert.certificate_id}
                      className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                    >
                      {downloading === cert.certificate_id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
}