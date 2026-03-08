const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateReportPDF = async (data) => {
  const { workshop, attendanceStats, feedbackStats, studentLogs } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 }
    });

    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);

        const result = await new Promise((res, rej) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'workshield/reports',
              public_id: `report_${workshop.workshop_id}_${Date.now()}`,
              format: 'pdf'
            },
            (error, result) => {
              if (error) rej(error);
              else res(result);
            }
          ).end(pdfBuffer);
        });

        resolve({ cloudinaryUrl: result.secure_url, fileName: `report_${workshop.workshop_id}.pdf` });
      } catch (err) {
        reject(err);
      }
    });
    doc.on('error', reject);

    const W = doc.page.width;

    // ── Header ──────────────────────────────────────────────
    doc.rect(0, 0, W + 100, 80).fill('#1a3a6b');
    doc.fontSize(20).fillColor('white').font('Helvetica-Bold')
      .text('Workshop Report', 50, 20);
    doc.fontSize(9).fillColor('#aac4e8').font('Helvetica')
      .text(`Workshop ID: ${workshop.workshop_id}   |   Date: ${new Date(workshop.date).toLocaleDateString('en-IN')}   |   Generated: ${new Date().toLocaleString('en-IN')}`, 50, 48);

    let y = 100;

    // ── Section helper ───────────────────────────────────────
    const sectionTitle = (title) => {
      doc.fontSize(11).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text(title, 50, y);
      y += 16;
      doc.moveTo(50, y).lineTo(W - 50, y).lineWidth(1.5).strokeColor('#1a3a6b').stroke();
      y += 10;
    };

    const tableRow = (cols, widths, isHeader = false, isAlt = false) => {
      const rowH = 20;
      if (isHeader) {
        doc.rect(50, y, widths.reduce((a, b) => a + b, 0), rowH).fill('#1a3a6b');
      } else if (isAlt) {
        doc.rect(50, y, widths.reduce((a, b) => a + b, 0), rowH).fill('#f0f4ff');
      }
      let x = 50;
      cols.forEach((col, i) => {
        doc.fontSize(8)
          .fillColor(isHeader ? 'white' : '#222')
          .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
          .text(String(col), x + 4, y + 5, { width: widths[i] - 8, ellipsis: true });
        x += widths[i];
      });
      doc.rect(50, y, widths.reduce((a, b) => a + b, 0), rowH).lineWidth(0.3).strokeColor('#ddd').stroke();
      y += rowH;
    };

    // ── Section 1: Workshop Details ──────────────────────────
    sectionTitle('SECTION 1 — WORKSHOP SUMMARY');

    // Stats boxes
    const stats = [
      { value: attendanceStats.totalScanned, label: 'Total Scanned' },
      { value: attendanceStats.totalVerified, label: 'Verified Present' },
      { value: `${attendanceStats.attendancePercentage}%`, label: 'Attendance Rate' },
      { value: feedbackStats.total_submissions, label: 'Feedback Submitted' }
    ];
    const boxW = 110;
    stats.forEach((s, i) => {
      const bx = 50 + i * (boxW + 8);
      doc.rect(bx, y, boxW, 44).fill('#f0f4ff').stroke();
      doc.fontSize(20).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text(String(s.value), bx, y + 6, { width: boxW, align: 'center' });
      doc.fontSize(7).fillColor('#666').font('Helvetica')
        .text(s.label.toUpperCase(), bx, y + 30, { width: boxW, align: 'center' });
    });
    y += 56;

    // Workshop details table
    const details = [
      ['Title', workshop.title],
      ['Topic', workshop.topic],
      ['Speaker', workshop.speaker],
      ['Date', new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
      ['Time', `${workshop.start_time} – ${workshop.end_time}`],
      ['Min Duration', `${workshop.min_duration_minutes} minutes`],
      ['Random Check', workshop.random_check_enabled ? 'Enabled' : 'Disabled']
    ];
    details.forEach(([k, v], i) => {
      if (isAlt = i % 2 !== 0) doc.rect(50, y, 445, 18).fill('#f7f9ff');
      doc.fontSize(8).fillColor('#333').font('Helvetica-Bold').text(k, 54, y + 4, { width: 120 });
      doc.fontSize(8).fillColor('#444').font('Helvetica').text(String(v), 180, y + 4, { width: 310 });
      y += 18;
    });
    y += 16;

    // ── Section 2: Attendance ────────────────────────────────
    sectionTitle('SECTION 2 — ATTENDANCE ANALYSIS');
    tableRow(['Metric', 'Value'], [280, 165], true);
    [
      ['Average Duration', `${attendanceStats.avgDuration} mins`],
      ['Early Exits', attendanceStats.earlyExits],
      ['No Exit Scanned', attendanceStats.noExit],
      ['Verified Rate', `${attendanceStats.attendancePercentage}%`]
    ].forEach(([k, v], i) => tableRow([k, v], [280, 165], false, i % 2 !== 0));
    y += 16;

    // ── Section 3: Feedback ──────────────────────────────────
    sectionTitle('SECTION 3 — FEEDBACK ANALYSIS');
    doc.fontSize(9).fillColor('#333').font('Helvetica')
      .text(`Overall Average Rating: `, 50, y, { continued: true })
      .font('Helvetica-Bold').fillColor('#1a3a6b')
      .text(`${feedbackStats.overall_average} / 5`, { continued: false });
    y += 16;

    tableRow(['Question', 'Avg Score', 'Responses'], [280, 80, 85], true);
    (feedbackStats.per_question || []).forEach((q, i) => {
      tableRow([q.question, `${q.average}/5`, q.total_responses], [280, 80, 85], false, i % 2 !== 0);
    });
    y += 16;

    // ── Section 4: Attendance List ───────────────────────────
    if (y > 650) { doc.addPage(); y = 50; }
    sectionTitle('SECTION 4 — FULL ATTENDANCE RECORD');
    tableRow(['#', 'Name', 'Roll No', 'Year', 'Entry', 'Exit', 'Duration', 'Status'], [25, 110, 70, 40, 50, 50, 55, 55], true);

    studentLogs.forEach((log, i) => {
      if (y > 750) { doc.addPage(); y = 50; }
      tableRow([
        i + 1,
        log.student_id?.name || 'N/A',
        log.student_id?.roll_number || 'N/A',
        `Year ${log.student_id?.year || 'N/A'}`,
        log.entry_time ? new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        log.exit_time ? new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        `${log.total_duration_minutes || 0} mins`,
        log.verified_status ? '✓ Verified' : '✗ Not Verified'
      ], [25, 110, 70, 40, 50, 50, 55, 55], false, i % 2 !== 0);
    });

    // ── Footer ───────────────────────────────────────────────
    y += 20;
    doc.fontSize(7).fillColor('#999').font('Helvetica')
      .text(`Generated by WorkShield System | Workshop ID: ${workshop.workshop_id} | ${new Date().toLocaleString('en-IN')}`, 50, y, { align: 'center', width: W - 100 });

    doc.end();
  });
};

module.exports = { generateReportPDF };