const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate certificate HTML
 * Department template will replace this later
 */
const buildCertificateHTML = (data) => {
  const {
    studentName,
    rollNumber,
    workshopTitle,
    workshopTopic,
    speaker,
    date,
    certificateId,
    verifyURL,
    department
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Participation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Georgia', serif;
      background: #fff;
      width: 297mm;
      height: 210mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .certificate {
      width: 287mm;
      height: 200mm;
      border: 12px solid #1a3a6b;
      position: relative;
      padding: 20px 40px;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }

    /* Corner decorations */
    .certificate::before {
      content: '';
      position: absolute;
      top: 8px; left: 8px; right: 8px; bottom: 8px;
      border: 2px solid #c9a84c;
      pointer-events: none;
    }

    .header {
      text-align: center;
      width: 100%;
      border-bottom: 2px solid #1a3a6b;
      padding-bottom: 12px;
    }

    .dept-name {
      font-size: 13pt;
      font-weight: bold;
      color: #1a3a6b;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .college-name {
      font-size: 11pt;
      color: #444;
      margin-top: 2px;
    }

    .cert-title {
      font-size: 28pt;
      color: #c9a84c;
      font-family: 'Georgia', serif;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin: 8px 0 4px;
      text-align: center;
    }

    .cert-subtitle {
      font-size: 11pt;
      color: #555;
      letter-spacing: 2px;
      text-align: center;
    }

    .body {
      text-align: center;
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .presented-to {
      font-size: 11pt;
      color: #555;
      letter-spacing: 1px;
    }

    .student-name {
      font-size: 26pt;
      color: #1a3a6b;
      font-family: 'Georgia', serif;
      border-bottom: 2px solid #c9a84c;
      padding: 0 40px 6px;
      margin: 4px 0;
    }

    .roll-number {
      font-size: 10pt;
      color: #777;
      letter-spacing: 1px;
    }

    .participation-text {
      font-size: 11pt;
      color: #444;
      max-width: 500px;
      line-height: 1.6;
      text-align: center;
    }

    .workshop-title {
      font-size: 14pt;
      color: #1a3a6b;
      font-weight: bold;
      font-style: italic;
    }

    .workshop-meta {
      font-size: 10pt;
      color: #666;
    }

    .footer {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #ddd;
      padding-top: 12px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      width: 140px;
      border-bottom: 1px solid #333;
      margin-bottom: 4px;
      height: 30px;
    }

    .signature-label {
      font-size: 8pt;
      color: #555;
      letter-spacing: 1px;
    }

    .cert-meta {
      text-align: center;
      font-size: 8pt;
      color: #888;
      line-height: 1.6;
    }

    .cert-id {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #1a3a6b;
      font-weight: bold;
    }

    .verify-url {
      font-size: 7pt;
      color: #999;
    }

    .gold-star {
      color: #c9a84c;
      font-size: 18pt;
    }
  </style>
</head>
<body>
  <div class="certificate">

    <!-- Header -->
    <div class="header">
      <div class="dept-name">${department}</div>
      <div class="college-name">Department Workshop Series</div>
    </div>

    <!-- Title -->
    <div class="cert-title">Certificate</div>
    <div class="cert-subtitle">OF PARTICIPATION</div>

    <!-- Body -->
    <div class="body">
      <div class="gold-star">✦ ✦ ✦</div>
      <div class="presented-to">THIS IS TO CERTIFY THAT</div>
      <div class="student-name">${studentName}</div>
      <div class="roll-number">Roll No: ${rollNumber}</div>
      <div class="participation-text">
        has successfully participated in the workshop
      </div>
      <div class="workshop-title">"${workshopTitle}"</div>
      <div class="participation-text">on the topic of <strong>${workshopTopic}</strong></div>
      <div class="workshop-meta">
        Conducted by <strong>${speaker}</strong> &nbsp;|&nbsp; Date: <strong>${date}</strong>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">WORKSHOP COORDINATOR</div>
      </div>

      <div class="cert-meta">
        <div class="cert-id">Certificate ID: ${certificateId}</div>
        <div class="verify-url">Verify at: ${verifyURL}</div>
        <div>Issued on: ${new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric'
        })}</div>
      </div>

      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">HEAD OF DEPARTMENT</div>
      </div>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Generate certificate PDF using Puppeteer
 * @param {Object} data - certificate data
 * @returns {Object} { filePath, fileName }
 */
const generateCertificatePDF = async (data) => {
  const html = buildCertificateHTML(data);

  const outputDir = path.join(__dirname, '../../generated/certificates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `certificate_${data.certificateId}.pdf`;
  const filePath = path.join(outputDir, fileName);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' }
    });
  } finally {
    await browser.close();
  }

  return { filePath, fileName };
};

module.exports = { generateCertificatePDF };