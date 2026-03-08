const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Build complete report HTML
 */
const buildReportHTML = (data) => {
  const {
    workshop,
    attendanceStats,
    feedbackStats,
    studentLogs
  } = data;

  // ── Build per-question feedback rows ──────────────────────
  const feedbackRows = feedbackStats.per_question.map(q => `
    <tr>
      <td>${q.question}</td>
      <td class="center">${q.average}/5</td>
      <td class="center">${q.total_responses}</td>
      <td>
        <div class="rating-bar">
          <div class="rating-fill" style="width:${(q.average/5)*100}%"></div>
        </div>
      </td>
    </tr>
  `).join('');

  // ── Build attendance rows ──────────────────────────────────
  const attendanceRows = studentLogs.map((log, i) => `
    <tr class="${i % 2 === 0 ? '' : 'alt'}">
      <td class="center">${i + 1}</td>
      <td>${log.student_id?.name || 'N/A'}</td>
      <td class="center">${log.student_id?.roll_number || 'N/A'}</td>
      <td class="center">Year ${log.student_id?.year || 'N/A'}</td>
      <td class="center">${log.entry_time ? new Date(log.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
      <td class="center">${log.exit_time ? new Date(log.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
      <td class="center">${log.total_duration_minutes} mins</td>
      <td class="center ${log.verified_status ? 'verified' : 'not-verified'}">
        ${log.verified_status ? '✓ Verified' : '✗ Not Verified'}
      </td>
    </tr>
  `).join('');

  // ── Year wise breakdown ────────────────────────────────────
  const yearBreakdown = attendanceStats.yearWise;
  const yearRows = Object.entries(yearBreakdown).map(([year, count]) => `
    <tr>
      <td>Year ${year}</td>
      <td class="center">${count}</td>
      <td class="center">${Math.round((count / attendanceStats.totalVerified) * 100)}%</td>
    </tr>
  `).join('');

  // ── Rating distribution bars ───────────────────────────────
  const ratingBars = Object.entries(feedbackStats.rating_distribution)
    .reverse()
    .map(([star, count]) => {
      const pct = feedbackStats.total_submissions > 0
        ? Math.round((count / feedbackStats.total_submissions) * 100)
        : 0;
      return `
        <div class="dist-row">
          <span class="star-label">${star} ★</span>
          <div class="dist-bar-wrap">
            <div class="dist-bar" style="width:${pct}%"></div>
          </div>
          <span class="dist-count">${count} (${pct}%)</span>
        </div>
      `;
    }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Workshop Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      color: #222;
      background: #fff;
      padding: 20px 30px;
    }

    /* ── Header ── */
    .report-header {
      background: #1a3a6b;
      color: white;
      padding: 20px 24px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .report-header h1 {
      font-size: 18pt;
      letter-spacing: 1px;
    }
    .report-header p {
      font-size: 9pt;
      opacity: 0.8;
      margin-top: 4px;
    }
    .report-meta {
      display: flex;
      gap: 30px;
      margin-top: 10px;
      font-size: 9pt;
    }
    .report-meta span { opacity: 0.9; }

    /* ── Section ── */
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1a3a6b;
      border-bottom: 2px solid #1a3a6b;
      padding-bottom: 4px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ── Stats Cards ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .stat-card {
      background: #f0f4ff;
      border: 1px solid #d0d8f0;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 22pt;
      font-weight: bold;
      color: #1a3a6b;
    }
    .stat-label {
      font-size: 8pt;
      color: #666;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    th {
      background: #1a3a6b;
      color: white;
      padding: 8px 10px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e8e8e8;
    }
    tr.alt td { background: #f7f9ff; }
    .center { text-align: center; }
    .verified { color: #00a550; font-weight: bold; }
    .not-verified { color: #cc0000; }

    /* ── Rating bar ── */
    .rating-bar {
      background: #e8e8e8;
      border-radius: 4px;
      height: 10px;
      width: 100%;
    }
    .rating-fill {
      background: #c9a84c;
      height: 10px;
      border-radius: 4px;
    }

    /* ── Distribution ── */
    .dist-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .star-label { width: 30px; font-size: 9pt; color: #555; }
    .dist-bar-wrap {
      flex: 1;
      background: #e8e8e8;
      border-radius: 4px;
      height: 14px;
    }
    .dist-bar {
      background: #2e75b6;
      height: 14px;
      border-radius: 4px;
      min-width: 2px;
    }
    .dist-count { width: 70px; font-size: 8pt; color: #666; }

    /* ── Two column layout ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    /* ── Comments box ── */
    .comments-box {
      background: #f7f9ff;
      border-left: 3px solid #2e75b6;
      padding: 8px 12px;
      margin-bottom: 6px;
      font-size: 9pt;
      color: #444;
      border-radius: 0 4px 4px 0;
    }

    /* ── Footer ── */
    .report-footer {
      margin-top: 30px;
      border-top: 1px solid #ddd;
      padding-top: 10px;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }

    /* ── Page break ── */
    .page-break { page-break-before: always; }

    /* ── Overall rating badge ── */
    .rating-badge {
      display: inline-block;
      background: #1a3a6b;
      color: white;
      font-size: 20pt;
      font-weight: bold;
      padding: 10px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>

  <!-- ── HEADER ── -->
  <div class="report-header">
    <h1>Workshop Report</h1>
    <p>Department of ${workshop.department || 'Computer Science'}</p>
    <div class="report-meta">
      <span>📋 Workshop ID: ${workshop.workshop_id}</span>
      <span>📅 Date: ${new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      <span>🕐 Generated: ${new Date().toLocaleString('en-IN')}</span>
    </div>
  </div>

  <!-- ── SECTION 1: WORKSHOP SUMMARY ── -->
  <div class="section">
    <div class="section-title">Section 1 — Workshop Summary</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${attendanceStats.totalScanned}</div>
        <div class="stat-label">Total Scanned</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${attendanceStats.totalVerified}</div>
        <div class="stat-label">Verified Present</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${attendanceStats.attendancePercentage}%</div>
        <div class="stat-label">Attendance Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${feedbackStats.total_submissions}</div>
        <div class="stat-label">Feedback Submitted</div>
      </div>
    </div>
    <table>
      <tr><th colspan="2">Workshop Details</th></tr>
      <tr><td><strong>Title</strong></td><td>${workshop.title}</td></tr>
      <tr><td><strong>Topic</strong></td><td>${workshop.topic}</td></tr>
      <tr><td><strong>Speaker</strong></td><td>${workshop.speaker}</td></tr>
      <tr><td><strong>Date</strong></td>
        <td>${new Date(workshop.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
      </tr>
      <tr><td><strong>Time</strong></td><td>${workshop.start_time} – ${workshop.end_time}</td></tr>
      <tr><td><strong>Min Duration Required</strong></td><td>${workshop.min_duration_minutes} minutes</td></tr>
      <tr><td><strong>Random Check</strong></td>
        <td>${workshop.random_check_enabled ? 'Enabled' : 'Disabled'}</td>
      </tr>
    </table>
  </div>

  <!-- ── SECTION 2: ATTENDANCE ANALYSIS ── -->
  <div class="section">
    <div class="section-title">Section 2 — Attendance Analysis</div>
    <div class="two-col">
      <div>
        <table>
          <tr><th colspan="3">Year-wise Participation</th></tr>
          <tr>
            <th>Year</th>
            <th class="center">Count</th>
            <th class="center">Percentage</th>
          </tr>
          ${yearRows || '<tr><td colspan="3" class="center">No data</td></tr>'}
        </table>
      </div>
      <div>
        <table>
          <tr><th colspan="2">Attendance Metrics</th></tr>
          <tr>
            <td>Average Duration</td>
            <td class="center"><strong>${attendanceStats.avgDuration} mins</strong></td>
          </tr>
          <tr>
            <td>Early Exits</td>
            <td class="center"><strong>${attendanceStats.earlyExits}</strong></td>
          </tr>
          <tr>
            <td>No Exit Scanned</td>
            <td class="center"><strong>${attendanceStats.noExit}</strong></td>
          </tr>
          <tr>
            <td>Verified Rate</td>
            <td class="center"><strong>${attendanceStats.attendancePercentage}%</strong></td>
          </tr>
        </table>
      </div>
    </div>
  </div>

  <!-- ── SECTION 3: FEEDBACK ANALYSIS ── -->
  <div class="section">
    <div class="section-title">Section 3 — Feedback Analysis</div>
    <div class="two-col">
      <div>
        <div style="margin-bottom:10px">
          <div class="rating-badge">${feedbackStats.overall_average} / 5</div>
          <div style="font-size:9pt;color:#666">Overall Average Rating</div>
        </div>
        <div>${ratingBars}</div>
      </div>
      <div>
        <table>
          <tr>
            <th>Question</th>
            <th class="center">Avg</th>
            <th class="center">Responses</th>
            <th>Score</th>
          </tr>
          ${feedbackRows || '<tr><td colspan="4" class="center">No feedback yet</td></tr>'}
        </table>
      </div>
    </div>
  </div>

  <!-- ── SECTION 4: COMMENTS & SUGGESTIONS ── -->
  <div class="section">
    <div class="section-title">Section 4 — Student Comments & Suggestions</div>
    <div class="two-col">
      <div>
        <p style="font-weight:bold;margin-bottom:8px">Comments</p>
        ${feedbackStats.comments?.length
          ? feedbackStats.comments.map(c => `<div class="comments-box">${c}</div>`).join('')
          : '<div class="comments-box">No comments submitted</div>'
        }
      </div>
      <div>
        <p style="font-weight:bold;margin-bottom:8px">Suggestions</p>
        ${feedbackStats.suggestions?.length
          ? feedbackStats.suggestions.map(s => `<div class="comments-box">${s}</div>`).join('')
          : '<div class="comments-box">No suggestions submitted</div>'
        }
      </div>
    </div>
  </div>

  <!-- ── SECTION 5: FULL ATTENDANCE LIST ── -->
  <div class="section page-break">
    <div class="section-title">Section 5 — Full Attendance Record</div>
    <table>
      <tr>
        <th class="center">Sr.</th>
        <th>Name</th>
        <th class="center">Roll No</th>
        <th class="center">Year</th>
        <th class="center">Entry</th>
        <th class="center">Exit</th>
        <th class="center">Duration</th>
        <th class="center">Status</th>
      </tr>
      ${attendanceRows || '<tr><td colspan="8" class="center">No attendance records</td></tr>'}
    </table>
  </div>

  <!-- ── FOOTER ── -->
  <div class="report-footer">
    Generated by WorkShield System &nbsp;|&nbsp;
    Workshop ID: ${workshop.workshop_id} &nbsp;|&nbsp;
    Report Date: ${new Date().toLocaleString('en-IN')}
  </div>

</body>
</html>
  `;
};

/**
 * Generate report PDF
 */
const generateReportPDF = async (data) => {
  const html = buildReportHTML(data);

  const outputDir = path.join(__dirname, '../../generated/reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `report_${data.workshop.workshop_id}_${Date.now()}.pdf`;
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
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });
  } finally {
    await browser.close();
  }

  return { filePath, fileName };
};

module.exports = { generateReportPDF };