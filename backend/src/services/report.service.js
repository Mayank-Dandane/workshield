const PDFDocument = require('pdfkit');

const generateReportPDF = async (data) => {
  const { workshop, attendanceStats, feedbackStats, studentLogs } = data;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve({
          base64: pdfBuffer.toString('base64'),
          fileName: `report_${workshop.workshop_id}.pdf`
        });
      });

      const W = doc.page.width - 100;

      // Header
      doc.fontSize(18).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text('WORKSHOP REPORT', 50, 50, { align: 'center', width: W });
      doc.fontSize(10).fillColor('#444').font('Helvetica')
        .text("JSPM's RSCOE — Dept. of Automation & Robotics", 50, 75, { align: 'center', width: W });
      doc.moveTo(50, 95).lineTo(550, 95).lineWidth(2).strokeColor('#1a3a6b').stroke();

      // Workshop Details
      doc.fontSize(12).fillColor('#1a3a6b').font('Helvetica-Bold').text('Workshop Details', 50, 110);
      doc.moveTo(50, 125).lineTo(550, 125).lineWidth(0.5).strokeColor('#ccc').stroke();

      const details = [
        ['Workshop ID', workshop.workshop_id],
        ['Title', workshop.title],
        ['Topic', workshop.topic],
        ['Speaker', workshop.speaker],
        ['Date', new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
        ['Time', `${workshop.start_time} - ${workshop.end_time}`],
        ['Min Duration', `${workshop.min_duration_minutes} minutes`],
      ];

      let y = 132;
      details.forEach(([key, val], i) => {
        if (i % 2 === 0) doc.rect(50, y, W, 18).fill('#f5f7fa');
        doc.fontSize(9).fillColor('#333').font('Helvetica-Bold').text(key + ':', 55, y + 4, { width: 150 });
        doc.fontSize(9).fillColor('#444').font('Helvetica').text(String(val || 'N/A'), 210, y + 4, { width: W - 160 });
        y += 18;
      });

      // Attendance Stats
      y += 15;
      doc.fontSize(12).fillColor('#1a3a6b').font('Helvetica-Bold').text('Attendance Summary', 50, y);
      y += 18;
      doc.moveTo(50, y).lineTo(550, y).lineWidth(0.5).strokeColor('#ccc').stroke();
      y += 8;

      const statsData = [
        ['Total Scanned', attendanceStats.totalScanned],
        ['Total Verified', attendanceStats.totalVerified],
        ['Attendance Rate', `${attendanceStats.attendancePercentage}%`],
        ['Average Duration', `${attendanceStats.avgDuration} mins`],
        ['Early Exits', attendanceStats.earlyExits],
        ['No Exit Scanned', attendanceStats.noExit],
      ];

      statsData.forEach(([key, val], i) => {
        if (i % 2 === 0) doc.rect(50, y, W, 18).fill('#f5f7fa');
        doc.fontSize(9).fillColor('#333').font('Helvetica-Bold').text(key + ':', 55, y + 4, { width: 150 });
        doc.fontSize(9).fillColor('#444').font('Helvetica').text(String(val || '0'), 210, y + 4, { width: W - 160 });
        y += 18;
      });

      // Feedback
      y += 15;
      doc.fontSize(12).fillColor('#1a3a6b').font('Helvetica-Bold').text('Feedback Analysis', 50, y);
      y += 18;
      doc.moveTo(50, y).lineTo(550, y).lineWidth(0.5).strokeColor('#ccc').stroke();
      y += 8;

      doc.rect(50, y, W, 18).fill('#f5f7fa');
      doc.fontSize(9).fillColor('#333').font('Helvetica-Bold').text('Total Submissions:', 55, y + 4, { width: 150 });
      doc.fontSize(9).fillColor('#444').font('Helvetica').text(String(feedbackStats.total_submissions || 0), 210, y + 4);
      y += 18;
      doc.fontSize(9).fillColor('#333').font('Helvetica-Bold').text('Overall Average:', 55, y + 4, { width: 150 });
      doc.fontSize(9).fillColor('#444').font('Helvetica').text(`${feedbackStats.overall_average || 0} / 5`, 210, y + 4);
      y += 24;

      if (feedbackStats.per_question?.length) {
        doc.rect(50, y, W, 18).fill('#1a3a6b');
        doc.fontSize(8).fillColor('white').font('Helvetica-Bold').text('Question', 55, y + 4, { width: 280 });
        doc.fontSize(8).fillColor('white').font('Helvetica-Bold').text('Avg Score', 340, y + 4, { width: 80 });
        doc.fontSize(8).fillColor('white').font('Helvetica-Bold').text('Responses', 430, y + 4, { width: 80 });
        y += 18;

        feedbackStats.per_question.forEach((q, i) => {
          if (i % 2 === 0) doc.rect(50, y, W, 18).fill('#f5f7fa');
          doc.fontSize(8).fillColor('#333').font('Helvetica').text(q.question || '', 55, y + 4, { width: 280 });
          doc.fontSize(8).fillColor('#333').font('Helvetica').text(`${q.average}/5`, 340, y + 4, { width: 80 });
          doc.fontSize(8).fillColor('#333').font('Helvetica').text(String(q.total_responses), 430, y + 4, { width: 80 });
          y += 18;
        });
      }

      // Attendance List
      if (studentLogs?.length) {
        doc.addPage();
        y = 50;
        doc.fontSize(12).fillColor('#1a3a6b').font('Helvetica-Bold').text('Full Attendance Record', 50, y);
        y += 18;
        doc.moveTo(50, y).lineTo(550, y).lineWidth(0.5).strokeColor('#ccc').stroke();
        y += 8;

        doc.rect(50, y, W, 18).fill('#1a3a6b');
        ['#', 'Name', 'Roll No', 'Entry', 'Exit', 'Duration', 'Status'].forEach((h, i) => {
          const xs = [55, 78, 200, 275, 333, 391, 454];
          const ws = [20, 120, 70, 55, 55, 60, 60];
          doc.fontSize(7).fillColor('white').font('Helvetica-Bold').text(h, xs[i], y + 4, { width: ws[i] });
        });
        y += 18;

        studentLogs.forEach((log, i) => {
          if (y > 760) { doc.addPage(); y = 50; }
          if (i % 2 === 0) doc.rect(50, y, W, 16).fill('#f5f7fa');
          const cols = [
            String(i + 1),
            log.student_id?.name || 'N/A',
            log.student_id?.roll_number || 'N/A',
            log.entry_time ? new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            log.exit_time ? new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            `${log.total_duration_minutes || 0} mins`,
            log.verified_status ? 'Verified' : 'Not Verified'
          ];
          const xs = [55, 78, 200, 275, 333, 391, 454];
          const ws = [20, 120, 70, 55, 55, 60, 60];
          cols.forEach((col, ci) => {
            doc.fontSize(7)
              .fillColor(ci === 6 ? (log.verified_status ? '#00a550' : '#cc0000') : '#333')
              .font(ci === 6 ? 'Helvetica-Bold' : 'Helvetica')
              .text(col, xs[ci], y + 3, { width: ws[ci] });
          });
          y += 16;
        });
      }

      doc.fontSize(7).fillColor('#999').font('Helvetica')
        .text(`Generated by WorkShield | ${new Date().toLocaleString('en-IN')}`, 50, 780, { align: 'center', width: W });

      doc.end();
    } catch (err) {
      console.error('[generateReportPDF]', err);
      reject(err);
    }
  });
};

module.exports = { generateReportPDF };