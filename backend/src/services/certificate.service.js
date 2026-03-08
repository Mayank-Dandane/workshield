const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateCertificatePDF = async (data) => {
  const {
    studentName, rollNumber, workshopTitle,
    workshopTopic, speaker, date,
    certificateId, verifyURL, department
  } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 }
    });

    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);

        // Upload to Cloudinary
        const result = await new Promise((res, rej) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'workshield/certificates',
              public_id: `certificate_${certificateId}`,
              format: 'pdf'
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                rej(error);
              }
              else res(result);
            }
          ).end(pdfBuffer);
        });

        resolve({ cloudinaryUrl: result.secure_url, fileName: `certificate_${certificateId}.pdf` });
      } catch (err) {
        reject(err);
      }
    });
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // ── Border ──────────────────────────────────────────────
    doc.rect(20, 20, W - 40, H - 40).lineWidth(8).strokeColor('#1a3a6b').stroke();
    doc.rect(28, 28, W - 56, H - 56).lineWidth(2).strokeColor('#c9a84c').stroke();

    // ── Header ──────────────────────────────────────────────
    doc.fontSize(13).fillColor('#1a3a6b').font('Helvetica-Bold')
      .text(department.toUpperCase(), 0, 45, { align: 'center', characterSpacing: 2 });

    doc.fontSize(10).fillColor('#666').font('Helvetica')
      .text('Department Workshop Series', 0, 62, { align: 'center' });

    doc.moveTo(50, 80).lineTo(W - 50, 80).lineWidth(1.5).strokeColor('#1a3a6b').stroke();

    // ── Title ────────────────────────────────────────────────
    doc.fontSize(36).fillColor('#c9a84c').font('Helvetica-Bold')
      .text('CERTIFICATE', 0, 90, { align: 'center', characterSpacing: 4 });

    doc.fontSize(12).fillColor('#555').font('Helvetica')
      .text('OF PARTICIPATION', 0, 132, { align: 'center', characterSpacing: 3 });

    // ── Stars ────────────────────────────────────────────────
    doc.fontSize(16).fillColor('#c9a84c')
      .text('✦  ✦  ✦', 0, 152, { align: 'center' });

    // ── Body ─────────────────────────────────────────────────
    doc.fontSize(11).fillColor('#555').font('Helvetica')
      .text('THIS IS TO CERTIFY THAT', 0, 178, { align: 'center', characterSpacing: 1 });

    doc.fontSize(28).fillColor('#1a3a6b').font('Helvetica-Bold')
      .text(studentName, 0, 196, { align: 'center' });

    // Underline student name
    const nameWidth = doc.widthOfString(studentName, { fontSize: 28 });
    const nameX = (W - nameWidth) / 2;
    doc.moveTo(nameX - 20, 232).lineTo(nameX + nameWidth + 20, 232)
      .lineWidth(1.5).strokeColor('#c9a84c').stroke();

    doc.fontSize(9).fillColor('#777').font('Helvetica')
      .text(`Roll No: ${rollNumber}`, 0, 238, { align: 'center', characterSpacing: 1 });

    doc.fontSize(11).fillColor('#444').font('Helvetica')
      .text('has successfully participated in the workshop', 0, 256, { align: 'center' });

    doc.fontSize(14).fillColor('#1a3a6b').font('Helvetica-BoldOblique')
      .text(`"${workshopTitle}"`, 0, 274, { align: 'center' });

    doc.fontSize(11).fillColor('#444').font('Helvetica')
      .text(`on the topic of `, 0, 296, { align: 'center', continued: true })
      .font('Helvetica-Bold').text(workshopTopic, { continued: false });

    doc.fontSize(10).fillColor('#666').font('Helvetica')
      .text(`Conducted by ${speaker}   |   Date: ${date}`, 0, 314, { align: 'center' });

    // ── Footer ───────────────────────────────────────────────
    doc.moveTo(50, H - 80).lineTo(W - 50, H - 80).lineWidth(0.5).strokeColor('#ddd').stroke();

    // Left signature
    doc.moveTo(80, H - 52).lineTo(220, H - 52).lineWidth(1).strokeColor('#333').stroke();
    doc.fontSize(8).fillColor('#555').font('Helvetica')
      .text('WORKSHOP COORDINATOR', 80, H - 46, { width: 140, align: 'center' });

    // Center cert info
    doc.fontSize(8).fillColor('#888').font('Helvetica')
      .text(`Certificate ID: ${certificateId}`, 0, H - 68, { align: 'center' })
      .text(`Verify at: ${verifyURL}`, 0, H - 58, { align: 'center' })
      .text(`Issued on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 0, H - 48, { align: 'center' });

    // Right signature
    doc.moveTo(W - 220, H - 52).lineTo(W - 80, H - 52).lineWidth(1).strokeColor('#333').stroke();
    doc.fontSize(8).fillColor('#555').font('Helvetica')
      .text('HEAD OF DEPARTMENT', W - 220, H - 46, { width: 140, align: 'center' });

    doc.end();
  });
};

module.exports = { generateCertificatePDF };