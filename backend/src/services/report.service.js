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
        console.log('[report] final buffer size:', pdfBuffer.length);
        resolve({
          base64: pdfBuffer.toString('base64'),
          fileName: `report_${workshop.workshop_id}.pdf`
        });
      });

      // ── Page 1 ───────────────────────────────────────────
      doc.fontSize(20).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text('WORKSHOP REPORT', { align: 'center' });

      doc.fontSize(10).fillColor('#444').font('Helvetica')
        .text("JSPM's RSCOE — Dept. of Automation & Robotics", { align: 'center' });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(2).strokeColor('#1a3a6b').stroke();
      doc.moveDown(1);

      // Workshop Details
      doc.fontSize(13).fillColor('#1a3a6b').font('Helvetica-Bold').text('Workshop Details');
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#aaa').stroke();
      doc.moveDown(0.5);

      const details = [
        ['Workshop ID', workshop.workshop_id],
        ['Title', workshop.title],
        ['Topic', workshop.topic],
        ['Speaker', workshop.speaker],
        ['Date', new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
        ['Time', `${workshop.start_time} - ${workshop.end_time}`],
        ['Min Duration', `${workshop.min_duration_minutes} minutes`],
      ];

      details.forEach(([key, val]) => {
        doc.fontSize(9).fillColor('#333').font('Helvetica-Bold')
          .text(key + ': ', { continued: true })
          .font('Helvetica').fillColor('#444')
          .text(String(val || 'N/A'));
      });

      doc.moveDown(1);

      // Attendance Stats
      doc.fontSize(13).fillColor('#1a3a6b').font('Helvetica-Bold').text('Attendance Summary');
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#aaa').stroke();
      doc.moveDown(0.5);

      const statsData = [
        ['Total Scanned', attendanceStats.totalScanned],
        ['Total Verified', attendanceStats.totalVerified],
        ['Attendance Rate', `${attendanceStats.attendancePercentage}%`],
        ['Average Duration', `${attendanceStats.avgDuration} mins`],
        ['Early Exits', attendanceStats.earlyExits],
        ['No Exit Scanned', attendanceStats.noExit],
      ];

      statsData.forEach(([key, val]) => {
        doc.fontSize(9).fillColor('#333').font('Helvetica-Bold')
          .text(key + ': ', { continued: true })
          .font('Helvetica').fillColor('#444')
          .text(String(val || '0'));
      });

      doc.moveDown(1);

      // Feedback
      doc.fontSize(13).fillColor('#1a3a6b').font('Helvetica-Bold').text('Feedback Analysis');
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#aaa').stroke();
      doc.moveDown(0.5);

      doc.fontSize(9).fillColor('#333').font('Helvetica-Bold')
        .text('Total Submissions: ', { continued: true })
        .font('Helvetica').fillColor('#444')
        .text(String(feedbackStats.total_submissions || 0));

      doc.fontSize(9).fillColor('#333').font('Helvetica-Bold')
        .text('Overall Average: ', { continued: true })
        .font('Helvetica').fillColor('#444')
        .text(`${feedbackStats.overall_average || 0} / 5`);

      doc.moveDown(0.5);

      if (feedbackStats.per_question?.length) {
        doc.fontSize(9).fillColor('#333').font('Helvetica-Bold').text('Per Question Ratings:');
        doc.moveDown(0.3);
        feedbackStats.per_question.forEach((q) => {
          doc.fontSize(8).fillColor('#444').font('Helvetica')
            .text(`• ${q.question}: ${q.average}/5 (${q.total_responses} responses)`);
        });
      }

      if (feedbackStats.comments?.length) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#333').font('Helvetica-Bold').text('Student Comments:');
        doc.moveDown(0.3);
        feedbackStats.comments.slice(0, 5).forEach((c) => {
          doc.fontSize(8).fillColor('#555').font('Helvetica').text(`"${c}"`);
        });
      }

      // ── Page 2: Attendance List ──────────────────────────
      if (studentLogs?.length) {
        doc.addPage();

        doc.fontSize(13).fillColor('#1a3a6b').font('Helvetica-Bold')
          .text('Full Attendance Record');
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#aaa').stroke();
        doc.moveDown(0.5);

        studentLogs.forEach((log, i) => {
          if (doc.y > 720) doc.addPage();
          const entry = log.entry_time ? new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
          const exit = log.exit_time ? new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
          const status = log.verified_status ? 'Verified' : 'Not Verified';
          const color = log.verified_status ? '#00a550' : '#cc0000';

          doc.fontSize(8).fillColor('#333').font('Helvetica')
            .text(`${i + 1}. ${log.student_id?.name || 'N/A'} (${log.student_id?.roll_number || 'N/A'}) — Entry: ${entry} | Exit: ${exit} | ${log.total_duration_minutes || 0} mins | `, { continued: true })
            .fillColor(color).font('Helvetica-Bold').text(status);
        });
      }

      // Footer
      doc.fontSize(7).fillColor('#999').font('Helvetica')
        .text(`Generated by WorkShield | ${new Date().toLocaleString('en-IN')}`, 50, 780, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      console.error('[generateReportPDF error]', err);
      reject(err);
    }
  });
};

module.exports = { generateReportPDF };