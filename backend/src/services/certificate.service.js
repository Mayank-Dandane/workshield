const PDFDocument = require('pdfkit');

const generateCertificatePDF = async (data) => {
  const { studentName, rollNumber, workshopTitle, workshopTopic, speaker, date, certificateId, verifyURL, department } = data;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve({
          base64: pdfBuffer.toString('base64'),
          fileName: `certificate_${certificateId}.pdf`
        });
      });

      const W = doc.page.width;
      const H = doc.page.height;

      // Border
      doc.rect(15, 15, W - 30, H - 30).lineWidth(6).strokeColor('#1a3a6b').stroke();
      doc.rect(22, 22, W - 44, H - 44).lineWidth(1.5).strokeColor('#c9a84c').stroke();

      // Header
      doc.fontSize(14).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text(department.toUpperCase(), 0, 42, { align: 'center', width: W });
      doc.fontSize(10).fillColor('#666').font('Helvetica')
        .text("JSPM's RSCOE — Department Workshop Series", 0, 60, { align: 'center', width: W });
      doc.moveTo(60, 78).lineTo(W - 60, 78).lineWidth(1).strokeColor('#1a3a6b').stroke();

      // Title
      doc.fontSize(32).fillColor('#c9a84c').font('Helvetica-Bold')
        .text('CERTIFICATE', 0, 88, { align: 'center', width: W });
      doc.fontSize(11).fillColor('#555').font('Helvetica')
        .text('OF PARTICIPATION', 0, 128, { align: 'center', width: W });

      doc.fontSize(14).fillColor('#c9a84c')
        .text('* * *', 0, 148, { align: 'center', width: W });

      // Body
      doc.fontSize(10).fillColor('#555').font('Helvetica')
        .text('THIS IS TO CERTIFY THAT', 0, 170, { align: 'center', width: W });

      doc.fontSize(26).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text(studentName, 0, 188, { align: 'center', width: W });

      // Underline
      const nameW = doc.widthOfString(studentName, { fontSize: 26 });
      const nameX = (W - nameW) / 2;
      doc.moveTo(nameX - 15, 222).lineTo(nameX + nameW + 15, 222)
        .lineWidth(1.5).strokeColor('#c9a84c').stroke();

      doc.fontSize(9).fillColor('#777').font('Helvetica')
        .text(`Roll No: ${rollNumber}`, 0, 228, { align: 'center', width: W });

      doc.fontSize(10).fillColor('#444').font('Helvetica')
        .text('has successfully participated in the workshop', 0, 248, { align: 'center', width: W });

      doc.fontSize(13).fillColor('#1a3a6b').font('Helvetica-BoldOblique')
        .text(`"${workshopTitle}"`, 0, 266, { align: 'center', width: W });

      doc.fontSize(10).fillColor('#444').font('Helvetica')
        .text(`Topic: ${workshopTopic}`, 0, 286, { align: 'center', width: W });

      doc.fontSize(10).fillColor('#666').font('Helvetica')
        .text(`Conducted by ${speaker}   |   Date: ${date}`, 0, 304, { align: 'center', width: W });

      // Footer
      doc.moveTo(60, H - 75).lineTo(W - 60, H - 75).lineWidth(0.5).strokeColor('#ddd').stroke();

      doc.moveTo(90, H - 48).lineTo(210, H - 48).lineWidth(1).strokeColor('#333').stroke();
      doc.fontSize(7).fillColor('#555').font('Helvetica')
        .text('WORKSHOP COORDINATOR', 90, H - 43, { width: 120, align: 'center' });

      doc.fontSize(7.5).fillColor('#888').font('Helvetica')
        .text(`Certificate ID: ${certificateId}`, 0, H - 62, { align: 'center', width: W })
        .text(`Verify at: ${verifyURL}`, 0, H - 52, { align: 'center', width: W })
        .text(`Issued: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 0, H - 42, { align: 'center', width: W });

      doc.moveTo(W - 210, H - 48).lineTo(W - 90, H - 48).lineWidth(1).strokeColor('#333').stroke();
      doc.fontSize(7).fillColor('#555').font('Helvetica')
        .text('HEAD OF DEPARTMENT', W - 210, H - 43, { width: 120, align: 'center' });

      doc.end();
    } catch (err) {
      console.error('[generateCertificatePDF]', err);
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF };