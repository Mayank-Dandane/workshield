import { useState, useEffect } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import { getMyCertificates, generateCertificate } from '../../api/certificate.api';
import { getMyAttendance } from '../../api/attendance.api';
import { getMyFeedback } from '../../api/feedback.api';
import toast from 'react-hot-toast';
import { Award, Download, CheckCircle, Lock, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';

const downloadCertificatePDF = (cert) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // Outer border
  doc.setDrawColor(26, 58, 107);
  doc.setLineWidth(4);
  doc.rect(8, 8, W - 16, H - 16);

  // Inner gold border
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(1);
  doc.rect(13, 13, W - 26, H - 26);

  // Header background
  doc.setFillColor(26, 58, 107);
  doc.rect(8, 8, W - 16, 22, 'F');

  // Department name
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(cert.department.toUpperCase(), W / 2, 17, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("JSPM's RSCOE — Department Workshop Series", W / 2, 24, { align: 'center' });

  // Gold line
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.8);
  doc.line(25, 32, W - 25, 32);

  // CERTIFICATE title
  doc.setFontSize(30);
  doc.setTextColor(201, 168, 76);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE', W / 2, 50, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('OF PARTICIPATION', W / 2, 59, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(201, 168, 76);
  doc.text('* * *', W / 2, 67, { align: 'center' });

  // Body
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('THIS IS TO CERTIFY THAT', W / 2, 76, { align: 'center' });

  doc.setFontSize(24);
  doc.setTextColor(26, 58, 107);
  doc.setFont('helvetica', 'bold');
  doc.text(cert.studentName, W / 2, 89, { align: 'center' });

  // Underline student name
  const nameWidth = doc.getTextWidth(cert.studentName) * (24 / 10);
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.8);
  doc.line((W - nameWidth) / 2 - 5, 92, (W + nameWidth) / 2 + 5, 92);

  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Roll No: ${cert.rollNumber}`, W / 2, 98, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('has successfully participated in the workshop', W / 2, 108, { align: 'center' });

  // ── Only topic now (no separate title) ──────────────────────────
  doc.setFontSize(13);
  doc.setTextColor(26, 58, 107);
  doc.setFont('helvetica', 'bolditalic');
  doc.text(`"${cert.workshopTopic}"`, W / 2, 121, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Conducted by ${cert.speaker}   |   Date: ${cert.date}`, W / 2, 132, { align: 'center' });

  // Footer line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(25, H - 28, W - 25, H - 28);

  // Signature lines
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.5);
  doc.line(30, H - 18, 85, H - 18);
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('WORKSHOP COORDINATOR', 57, H - 14, { align: 'center' });

  doc.line(W - 85, H - 18, W - 30, H - 18);
  doc.text('HEAD OF DEPARTMENT', W - 57, H - 14, { align: 'center' });

  // Cert info center
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(`Certificate ID: ${cert.certificateId}`, W / 2, H - 22, { align: 'center' });
  doc.text(`Verify at: ${cert.verifyURL}`, W / 2, H - 17, { align: 'center' });
  doc.text(`Issued: ${cert.issuedOn}`, W / 2, H - 12, { align: 'center' });

  doc.save(`certificate_${cert.certificateId}.pdf`);
};

export default function MyCertificates() {
  const [certificates, setCertificates]       = useState([]);
  const [eligibleWorkshops, setEligibleWorkshops] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [generating, setGenerating]           = useState('');
  const [downloading, setDownloading]         = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [certRes, attRes, feedRes] = await Promise.all([
        getMyCertificates(),
        getMyAttendance(),
        getMyFeedback()
      ]);

      const certs     = certRes.data.data.certificates || [];
      const logs      = attRes.data.data.logs || [];
      const feedbacks = feedRes.data.data.feedbacks || [];

      setCertificates([...certs].reverse());

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

  const handleDownload = (cert) => {
    setDownloading(cert.certificate_id);
    try {
      downloadCertificatePDF({
        studentName:   cert.student_id?.name         || 'Student',
        rollNumber:    cert.student_id?.roll_number  || '',
        // ── Only topic used now ──────────────────────────────────
        workshopTopic: cert.workshop_id?.topic       || '',
        speaker:       cert.workshop_id?.speakers?.join(', ') || cert.workshop_id?.speaker || '',
        date:          cert.workshop_id?.date
          ? new Date(cert.workshop_id.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
          : '',
        department:    cert.student_id?.department   || 'Automation & Robotics',
        certificateId: cert.certificate_id,
        verifyURL:     `${window.location.origin}/verify/${cert.certificate_id}`,
        issuedOn:      new Date(cert.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      });
      toast.success('Certificate downloaded!');
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

        <div>
          <h1 className="text-xl font-bold text-slate-800">My Certificates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Download your workshop participation certificates</p>
        </div>

        {/* ── Ready to Generate ── */}
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
                      {/* ── Show topic instead of title ── */}
                      <p className="font-semibold text-slate-800 text-sm">
                        {log.workshop_id?.topic || 'Workshop'}
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
                    {generating === log.workshop_id?._id
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      : <Award className="w-4 h-4" />}
                    Generate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Issued Certificates ── */}
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
              <p className="text-slate-400 text-sm mt-1">Complete attendance + feedback to earn certificates</p>
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
                      {/* ── Show topic instead of title ── */}
                      <p className="font-semibold text-slate-800 text-sm">
                        {cert.workshop_id?.topic || 'Workshop'}
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
                      onClick={() => handleDownload(cert)}
                      disabled={downloading === cert.certificate_id}
                      className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                    >
                      {downloading === cert.certificate_id
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        : <Download className="w-4 h-4" />}
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