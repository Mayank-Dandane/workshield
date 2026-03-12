/**
 * WorkShield Report Generator
 * Place this file at: backend/utils/reportGenerator.js
 *
 * Usage in route:
 *   const { generateWorkshopReport } = require('../utils/reportGenerator');
 *   const buffer = await generateWorkshopReport(workshop);
 *   res.setHeader('Content-Disposition', `attachment; filename="${workshop.workshop_id}_report.docx"`);
 *   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 *   res.send(buffer);
 */

const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    ImageRun, AlignmentType, BorderStyle, WidthType, VerticalAlign,
  } = require('docx');
  const path = require('path');
  const fs   = require('fs');
  
  // ── Logos (stored in backend/assets/) ────────────────────────────────────────
  const ASSETS_DIR = path.join(__dirname, '..', 'assets');
  const logoLeft  = fs.readFileSync(path.join(ASSETS_DIR, 'logo_left.png'));
  const logoRight = fs.readFileSync(path.join(ASSETS_DIR, 'logo_right.png'));
  
  // ── Year label map ────────────────────────────────────────────────────────────
  const YEAR_LABELS = {
    FY: { short: 'F. Y', full: 'First Year B. Tech Students' },
    SY: { short: 'S. Y', full: 'Second Year B. Tech Students' },
    TY: { short: 'T. Y', full: 'Third Year B. Tech Students' },
    BY: { short: 'B. Y', full: 'Fourth Year B. Tech Students' },
  };
  
  // ── Border helpers ────────────────────────────────────────────────────────────
  const noBorder   = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders  = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  
  // ── Text helpers ──────────────────────────────────────────────────────────────
  const bold   = (text, size = 22) => new TextRun({ text, bold: true,    size, font: 'Times New Roman' });
  const normal = (text, size = 22) => new TextRun({ text, bold: false,   size, font: 'Times New Roman' });
  const italic = (text, size = 22) => new TextRun({ text, italics: true, size, font: 'Times New Roman' });
  
  const para = (children, alignment = AlignmentType.LEFT, spacing = { before: 0, after: 80 }) =>
    new Paragraph({ children, alignment, spacing });
  
  const emptyPara = () => para([normal('')], AlignmentType.LEFT, { before: 0, after: 40 });
  
  const fieldPara = (label, value) =>
    para([bold(label + ': '), normal(value || '')]);
  
  const sectionHeading = (num, title) =>
    new Paragraph({
      children: [bold(`${num}. ${title}`, 22)],
      spacing: { before: 180, after: 80 },
    });
  
  // ── Format helpers ────────────────────────────────────────────────────────────
  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  
  function formatTime(timeStr) {
    // timeStr is "HH:MM" (24h) — convert to "10.00 AM" style
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour   = h % 12 || 12;
    return `${hour}.${String(m).padStart(2, '0')} ${period}`;
  }
  
  // ── Header table (college letterhead) ────────────────────────────────────────
  function buildHeaderTable(workshop) {
    const yearLabel   = YEAR_LABELS[workshop.targeted_year]?.short || 'S. Y';
    const academicYear = workshop.academic_year || '';
  
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [1100, 7160, 1100],
      borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideH: noBorder, insideV: noBorder },
      rows: [
        new TableRow({
          children: [
            // Left logo
            new TableCell({
              borders: noBorders,
              width: { size: 1100, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({ data: logoLeft, transformation: { width: 68, height: 62 }, type: 'png' })]
              })]
            }),
  
            // Center text
            new TableCell({
              borders: noBorders,
              width: { size: 7160, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 80, bottom: 80, left: 60, right: 60 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [bold("JSPM'S", 24)] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [bold('RAJARSHI SHAHU COLLEGE OF ENGINEERING, TATHAWADE', 22)] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [italic('(An Empowered Autonomous Institute Affiliated to SPPU)', 19)] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [bold('DEPARTMENT OF AUTOMATION AND ROBOTICS', 21)] }),
                // ← DYNAMIC: year label + academic year
                new Paragraph({ alignment: AlignmentType.CENTER, children: [bold(`${yearLabel} B. Tech.  A.Y. ${academicYear}`, 21)] }),
              ]
            }),
  
            // Right logo
            new TableCell({
              borders: noBorders,
              width: { size: 1100, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({ data: logoRight, transformation: { width: 72, height: 66 }, type: 'png' })]
              })]
            }),
          ]
        })
      ]
    });
  }
  
  // ── Signature table ───────────────────────────────────────────────────────────
  function buildSignaturesTable(coordinatorName = 'Prof. Coordinator', hodName = 'Dr. HOD') {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4680, 4680],
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
      rows: [
        new TableRow({
          children: [
            new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, children: [para([bold(coordinatorName)], AlignmentType.LEFT)] }),
            new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, children: [para([bold(hodName)], AlignmentType.RIGHT)] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, children: [para([normal('Coordinator, A & R')], AlignmentType.LEFT)] }),
            new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, children: [para([normal('HOD, A & R')], AlignmentType.RIGHT)] }),
          ]
        }),
      ]
    });
  }
  
  // ── Photos placeholder ────────────────────────────────────────────────────────
  function buildPhotosPlaceholder() {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4680, 4680],
      rows: [
        new TableRow({
          children: ['[Photo 1]', '[Photo 2]'].map(label =>
            new TableCell({
              borders: thinBorders,
              width: { size: 4680, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000, after: 1000 },
                children: [italic(label, 20)]
              })]
            })
          )
        })
      ]
    });
  }
  
  // ── Main export ───────────────────────────────────────────────────────────────
  async function generateWorkshopReport(workshop) {
    const yearLabels       = YEAR_LABELS[workshop.targeted_year] || YEAR_LABELS.SY;
    const targetedAudience = yearLabels.full;
    const speakerNames     = Array.isArray(workshop.speakers) ? workshop.speakers.join(', ') : (workshop.speakers || '');
    const timeRange        = `${formatTime(workshop.start_time)} to ${formatTime(workshop.end_time)}`;
  
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 720, right: 1080, bottom: 720, left: 1080 }
          }
        },
        children: [
          // ── Letterhead ──────────────────────────────────────────────────────
          buildHeaderTable(workshop),
          emptyPara(),
  
          // ── Report type headings ─────────────────────────────────────────────
          para([bold(workshop.report_type || 'Report on Industry Expert Session', 24)], AlignmentType.CENTER),
          para([bold(workshop.topic || '', 22)], AlignmentType.CENTER),
          emptyPara(),
  
          // ── Auto-populated fields ────────────────────────────────────────────
          fieldPara('Name of the Expert',  speakerNames),
          fieldPara('Name of the Industry', workshop.industry_name),
          fieldPara('Designation',          workshop.designation),
          fieldPara('Topic Name',           workshop.topic),
          fieldPara('Targeted Audience',    targetedAudience),         // ← dynamic
          fieldPara('Department',           'Automation & Robotics'),   // ← hardcoded
          fieldPara('Time',                 timeRange),
          fieldPara('Date',                 formatDate(workshop.date)),
          fieldPara('Venue',                workshop.venue),
          emptyPara(),
  
          // ── Sections (empty — faculty fills these in) ────────────────────────
          sectionHeading(1, 'Introduction'),
          para([normal('')]),
          emptyPara(),
  
          sectionHeading(2, 'Objective of the Session'),
          para([normal('')]),
          emptyPara(),
  
          sectionHeading(3, 'Speaker Profile'),
          para([normal('')]),
          emptyPara(),
  
          sectionHeading(4, 'Session Highlights'),
          para([normal('')]),
          emptyPara(),
  
          sectionHeading(5, 'Student Interaction'),
          para([normal('')]),
          emptyPara(),
  
          sectionHeading(6, 'Outcome and Feedback'),
          para([normal('')]),
          emptyPara(),
  
          sectionHeading(7, 'Conclusion'),
          para([normal('')]),
          emptyPara(),
  
          // ── Photos section ───────────────────────────────────────────────────
          para([bold('Glimpse of the Expert Lecture', 22)], AlignmentType.CENTER),
          emptyPara(),
          buildPhotosPlaceholder(),
          emptyPara(),
  
          // ── Signatures ───────────────────────────────────────────────────────
          buildSignaturesTable(
            workshop.coordinator_name || 'Prof. Coordinator',
            workshop.hod_name         || 'Dr. HOD'
          ),
        ]
      }]
    });
  
    return await Packer.toBuffer(doc);
  }
  
  module.exports = { generateWorkshopReport };