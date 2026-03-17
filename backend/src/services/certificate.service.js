const PDFDocument = require('pdfkit');

const generateCertificatePDF = async (data) => {
  const { studentName, rollNumber, workshopTitle, workshopTopic, speaker, date, certificateId, verifyURL, department } = data;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log('[certificate] buffer size:', pdfBuffer.length);
        resolve({
          base64: pdfBuffer.toString('base64'),
          fileName: `certificate_${certificateId}.pdf`
        });
      });

      const W = doc.page.width - 100;

      // Border
      doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30)
        .lineWidth(5).strokeColor('#1a3a6b').stroke();

      // Header
      doc.fontSize(14).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text(department.toUpperCase(), 50, 45, { align: 'center', width: W });

      doc.fontSize(10).fillColor('#666').font('Helvetica')
        .text("JSPM's RSCOE — Department Workshop Series", 50, 64, { align: 'center', width: W });

      doc.moveTo(60, 82).lineTo(doc.page.width - 60, 82)
        .lineWidth(1).strokeColor('#1a3a6b').stroke();

      // Title
      doc.fontSize(30).fillColor('#c9a84c').font('Helvetica-Bold')
        .text('CERTIFICATE', 50, 92, { align: 'center', width: W });

      doc.fontSize(11).fillColor('#555').font('Helvetica')
        .text('OF PARTICIPATION', 50, 130, { align: 'center', width: W });

      doc.fontSize(13).fillColor('#c9a84c')
        .text('* * *', 50, 150, { align: 'center', width: W });

      // Body
      doc.fontSize(10).fillColor('#555').font('Helvetica')
        .text('THIS IS TO CERTIFY THAT', 50, 173, { align: 'center', width: W });

      doc.fontSize(26).fillColor('#1a3a6b').font('Helvetica-Bold')
        .text(studentName, 50, 191, { align: 'center', width: W });

      doc.fontSize(9).fillColor('#777').font('Helvetica')
        .text(`Roll No: ${rollNumber}`, 50, 225, { align: 'center', width: W });

      doc.fontSize(10).fillColor('#444').font('Helvetica')
        .text('has successfully participated in the workshop', 50, 244, { align: 'center', width: W });

      doc.fontSize(13).fillColor('#1a3a6b').font('Helvetica-BoldOblique')
        .text(`"${workshopTitle}"`, 50, 262, { align: 'center', width: W });

      doc.fontSize(10).fillColor('#444').font('Helvetica')
        .text(`Topic: ${workshopTopic}`, 50, 282, { align: 'center', width: W });

      doc.fontSize(10).fillColor('#666').font('Helvetica')
        .text(`Conducted by ${speaker}   |   Date: ${date}`, 50, 300, { align: 'center', width: W });

      // Footer line
      doc.moveTo(60, doc.page.height - 80)
        .lineTo(doc.page.width - 60, doc.page.height - 80)
        .lineWidth(0.5).strokeColor('#ddd').stroke();

      // Signature lines
      doc.moveTo(80, doc.page.height - 52)
        .lineTo(210, doc.page.height - 52)
        .lineWidth(1).strokeColor('#333').stroke();
      doc.fontSize(7).fillColor('#555').font('Helvetica')
        .text('WORKSHOP COORDINATOR', 80, doc.page.height - 46, { width: 130, align: 'center' });

      doc.moveTo(doc.page.width - 210, doc.page.height - 52)
        .lineTo(doc.page.width - 80, doc.page.height - 52)
        .lineWidth(1).strokeColor('#333').stroke();
      doc.fontSize(7).fillColor('#555').font('Helvetica')
        .text('HEAD OF DEPARTMENT', doc.page.width - 210, doc.page.height - 46, { width: 130, align: 'center' });

      // Cert info — shifted up by 20px to avoid overlapping border
      doc.fontSize(7.5).fillColor('#888').font('Helvetica')
        .text(`Certificate ID: ${certificateId}`, 50, doc.page.height - 86, { align: 'center', width: W })
        .text(`Verify at: ${verifyURL}`,           50, doc.page.height - 76, { align: 'center', width: W })
        .text(`Issued: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, doc.page.height - 66, { align: 'center', width: W });

      doc.end();
    } catch (err) {
      console.error('[generateCertificatePDF error]', err);
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF };