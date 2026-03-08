const ExcelJS = require('exceljs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generate hybrid attendance Excel sheet
 * Only includes verified students
 * @param {Object} workshop - workshop document
 * @param {Array} logs - verified attendance logs with populated student
 * @returns {Object} { cloudinaryUrl, fileName }
 */
const generateAttendanceExcel = async (workshop, logs) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance Sheet');

  // ─── Workbook Properties ───────────────────────────────────
  workbook.creator = 'WorkShield System';
  workbook.created = new Date();

  // ─── Column Widths ─────────────────────────────────────────
  sheet.columns = [
    { key: 'sr',         width: 6  },
    { key: 'name',       width: 25 },
    { key: 'roll',       width: 15 },
    { key: 'year',       width: 8  },
    { key: 'dept',       width: 20 },
    { key: 'entry',      width: 18 },
    { key: 'exit',       width: 18 },
    { key: 'duration',   width: 12 },
    { key: 'verified',   width: 12 },
    { key: 'signature',  width: 20 }
  ];

  // ─── HEADER SECTION ────────────────────────────────────────

  // Row 1 — Department title
  sheet.mergeCells('A1:J1');
  const deptRow = sheet.getCell('A1');
  deptRow.value = 'DEPARTMENT OF AUTOMATION & ROBOTICS';
  deptRow.alignment = { horizontal: 'center', vertical: 'middle' };
  deptRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
  deptRow.font = { name: 'Arial', bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).height = 30;

  // Row 2 — Workshop title
  sheet.mergeCells('A2:J2');
  const titleRow = sheet.getCell('A2');
  titleRow.value = `Workshop: ${workshop.title}`;
  titleRow.font = { name: 'Arial', bold: true, size: 12 };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
  sheet.getRow(2).height = 22;

  // Row 3 — Workshop details
  sheet.mergeCells('A3:E3');
  sheet.getCell('A3').value = `Topic: ${workshop.topic}`;
  sheet.getCell('A3').font = { name: 'Arial', size: 10 };

  sheet.mergeCells('F3:J3');
  sheet.getCell('F3').value = `Speaker: ${workshop.speaker}`;
  sheet.getCell('F3').font = { name: 'Arial', size: 10 };
  sheet.getRow(3).height = 18;

  // Row 4 — Date and Workshop ID
  sheet.mergeCells('A4:E4');
  sheet.getCell('A4').value = `Date: ${new Date(workshop.date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  })}`;
  sheet.getCell('A4').font = { name: 'Arial', size: 10 };

  sheet.mergeCells('F4:J4');
  sheet.getCell('F4').value = `Workshop ID: ${workshop.workshop_id}`;
  sheet.getCell('F4').font = { name: 'Arial', size: 10 };
  sheet.getRow(4).height = 18;

  // Row 5 — Verified count
  sheet.mergeCells('A5:J5');
  sheet.getCell('A5').value = `Total Verified Students: ${logs.length}`;
  sheet.getCell('A5').font = { name: 'Arial', bold: true, size: 10 };
  sheet.getCell('A5').alignment = { horizontal: 'center' };
  sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
  sheet.getRow(5).height = 18;

  // Row 6 — Empty spacer
  sheet.getRow(6).height = 8;

  // ─── TABLE HEADER ROW ──────────────────────────────────────
  const headerRow = sheet.getRow(7);
  headerRow.values = [
    'Sr. No', 'Student Name', 'Roll Number', 'Year',
    'Department', 'Entry Time', 'Exit Time',
    'Duration (mins)', 'Verified', 'Signature'
  ];
  headerRow.height = 20;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // ─── DATA ROWS ─────────────────────────────────────────────
  logs.forEach((log, index) => {
    const student = log.student_id;
    const rowNum = 8 + index;
    const row = sheet.getRow(rowNum);

    const formatTime = (date) => date
      ? new Date(date).toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', hour12: true
        })
      : 'N/A';

    row.values = [
      index + 1,
      student.name,
      student.roll_number,
      `Year ${student.year}`,
      student.department,
      formatTime(log.entry_time),
      formatTime(log.exit_time),
      log.total_duration_minutes,
      '✓ Verified',
      ''
    ];

    row.height = 18;

    const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F7FC';

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
      };
      if (colNum === 2) cell.alignment = { horizontal: 'left', vertical: 'middle' };
      if (colNum === 9) cell.font = { name: 'Arial', size: 10, color: { argb: 'FF00B050' }, bold: true };
    });
  });

  // ─── FOOTER ────────────────────────────────────────────────
  const footerRowNum = 8 + logs.length + 1;
  sheet.mergeCells(`A${footerRowNum}:J${footerRowNum}`);
  const footerCell = sheet.getCell(`A${footerRowNum}`);
  footerCell.value = `This attendance sheet was digitally validated via WorkShield QR System. Workshop ID: ${workshop.workshop_id} | Generated: ${new Date().toLocaleString('en-IN')}`;
  footerCell.font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF808080' } };
  footerCell.alignment = { horizontal: 'center' };

  // ─── SIGNATURE NOTE ────────────────────────────────────────
  const sigNoteRowNum = footerRowNum + 1;
  sheet.mergeCells(`A${sigNoteRowNum}:J${sigNoteRowNum}`);
  const sigNote = sheet.getCell(`A${sigNoteRowNum}`);
  sigNote.value = 'Note: Students must sign in the Signature column upon verification of their attendance.';
  sigNote.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFF0000' } };
  sigNote.alignment = { horizontal: 'center' };

  // ─── Upload to Cloudinary ──────────────────────────────────
  const fileName = `attendance_${workshop.workshop_id}_${Date.now()}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();

  const cloudinaryUrl = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'workshield/excel',
        public_id: `attendance_${workshop.workshop_id}_${Date.now()}`,
        format: 'xlsx'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(Buffer.from(buffer));
  });

  return { cloudinaryUrl, fileName };
};

module.exports = { generateAttendanceExcel };