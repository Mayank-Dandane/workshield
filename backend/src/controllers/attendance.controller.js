  const Workshop = require('../models/Workshop');
const AttendanceLog = require('../models/AttendanceLog');
const { generateQRToken, generateQRImage, validateQRToken } = require('../services/qr.service');
const { getDurationMinutes } = require('../utils/time.util');
const { sendSuccess, sendError } = require('../utils/response.util');
const { generateAttendanceExcel } = require('../services/excel.service');


// ─────────────────────────────────────────────────────────────────
// @route   POST /api/attendance/generate-qr/:workshopId
// @desc    Generate rotating QR code for a workshop
// @access  Faculty only
// ─────────────────────────────────────────────────────────────────
const generateQR = async (req, res) => {
    try {
      const { workshopId } = req.params;
      const { type = 'entry' } = req.body;
  
      const workshop = await Workshop.findById(workshopId);
      if (!workshop) {
        return sendError(res, 404, 'Workshop not found');
      }
  
      if (workshop.status !== 'active') {
        return sendError(res, 400, `Workshop is not active. Current status: ${workshop.status}`);
      }
  
      // Generate encrypted token
      const { token, expiresAt, timestamp } = generateQRToken(
        workshop._id.toString(),
        workshop.qr_seed,
        type
      );
  
      // Generate QR image with URL embedded
      const { qrDataURL, scanURL } = await generateQRImage(
        token,
        workshop._id.toString()
      );
  
      return sendSuccess(res, 200, 'QR generated', {
        qr_image: qrDataURL,     // base64 PNG for faculty screen display
        scan_url: scanURL,        // the URL inside the QR (for debugging)
        token,                    // raw token (for Postman testing)
        type,
        expires_at: expiresAt,
        generated_at: timestamp,
        rotation_seconds: parseInt(process.env.QR_ROTATION_SECONDS) || 25
      });
  
    } catch (err) {
      console.error('[generateQR]', err.message);
      return sendError(res, 500, 'Failed to generate QR');
    }
  };

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/attendance/scan
// @desc    Student scans QR — logs entry or exit
// @access  Student only
// ─────────────────────────────────────────────────────────────────
const scanQR = async (req, res) => {
  try {
    const { token, workshop_id } = req.body;
    const studentId = req.user._id;

    if (!token || !workshop_id) {
      return sendError(res, 400, 'Token and workshop_id are required');
    }

    // Fetch workshop
    const workshop = await Workshop.findById(workshop_id);
    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    if (workshop.status !== 'active') {
      return sendError(res, 400, 'Workshop is not currently active');
    }

    // Validate QR token
    const validation = validateQRToken(
      token,
      workshop._id.toString(),
      workshop.qr_seed
    );

    if (!validation.valid) {
      return sendError(res, 400, validation.reason);
    }

    const scanType = validation.type; // entry | exit | random
    const now = new Date();

    // Find or create attendance log
    let log = await AttendanceLog.findOne({
      student_id: studentId,
      workshop_id: workshop._id
    });

    // ─── Handle ENTRY scan ────────────────────────────────────
// ─── Handle ENTRY scan ────────────────────────────────────
if (scanType === 'entry') {
  if (log && log.entry_time) {
    return sendError(res, 400, 'Entry already recorded for this workshop');
  }

  try {
    log = await AttendanceLog.findOneAndUpdate(
      { student_id: studentId, workshop_id: workshop._id },
      { $setOnInsert: { student_id: studentId, workshop_id: workshop._id }, $set: { entry_time: now } },
      { upsert: true, new: true }
    );
  } catch (dupErr) {
    return sendError(res, 400, 'Entry already recorded for this workshop');
  }

  return sendSuccess(res, 200, '✅ Entry recorded successfully', {
    type: 'entry',
    time: now,
    message: 'Your entry has been recorded. Remember to scan exit QR before leaving!'
  });
}

    // ─── Handle EXIT scan ─────────────────────────────────────
    if (scanType === 'exit') {
      if (!log || !log.entry_time) {
        return sendError(res, 400, 'No entry found. Please scan entry QR first.');
      }

      if (log.exit_time) {
        return sendError(res, 400, 'Exit already recorded for this workshop');
      }

      log.exit_time = now;

      // Calculate duration
      const duration = getDurationMinutes(log.entry_time, now);
      log.total_duration_minutes = duration;

      // Check if random check is required and passed
      const randomCheckRequired = workshop.random_check_enabled;
      const randomCheckPassed = randomCheckRequired ? log.random_check_passed : true;

      // Verify attendance
      if (
        duration >= workshop.min_duration_minutes &&
        randomCheckPassed
      ) {
        log.verified_status = true;
        log.verification_note = 'All conditions met';
      } else {
        log.verified_status = false;
        if (duration < workshop.min_duration_minutes) {
          log.verification_note = `Insufficient duration: ${duration} mins (required: ${workshop.min_duration_minutes} mins)`;
        } else if (!randomCheckPassed) {
          log.verification_note = 'Random check not completed';
        }
      }

      await log.save();

      return sendSuccess(res, 200, '✅ Exit recorded successfully', {
        type: 'exit',
        time: now,
        duration_minutes: duration,
        verified: log.verified_status,
        message: log.verified_status
          ? '🎉 Attendance verified! You can now submit feedback and get your certificate.'
          : `⚠️ Attendance not verified: ${log.verification_note}`
      });
    }

    // ─── Handle RANDOM CHECK scan ─────────────────────────────
    if (scanType === 'random') {
      if (!log || !log.entry_time) {
        return sendError(res, 400, 'No entry found. Please scan entry QR first.');
      }

      if (log.random_check_passed) {
        return sendSuccess(res, 200, 'Random check already completed', {
          type: 'random',
          already_passed: true
        });
      }

      log.random_check_time = now;
      log.random_check_passed = true;
      await log.save();

      return sendSuccess(res, 200, '✅ Random check passed!', {
        type: 'random',
        time: now,
        message: 'Mid-session check recorded successfully'
      });
    }

    return sendError(res, 400, 'Invalid QR type');

  } catch (err) {
    console.error('[scanQR]', err.message);
    return sendError(res, 500, 'Failed to process QR scan');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/attendance/workshop/:workshopId
// @desc    Get all attendance logs for a workshop
// @access  Faculty only
// ─────────────────────────────────────────────────────────────────
const getAttendanceByWorkshop = async (req, res) => {
  try {
    const logs = await AttendanceLog.find({
      workshop_id: req.params.workshopId
    })
      .populate('student_id', 'name roll_number year department email')
      .sort({ entry_time: 1 });

    const verified = logs.filter(l => l.verified_status).length;

    return sendSuccess(res, 200, 'Attendance fetched', {
      total: logs.length,
      verified,
      not_verified: logs.length - verified,
      logs
    });

  } catch (err) {
    console.error('[getAttendanceByWorkshop]', err.message);
    return sendError(res, 500, 'Failed to fetch attendance');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/attendance/my
// @desc    Student views their own attendance records
// @access  Student only
// ─────────────────────────────────────────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    const logs = await AttendanceLog.find({
      student_id: req.user._id
    })
      .populate('workshop_id', 'title date status workshop_id')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Your attendance records', {
      total: logs.length,
      logs
    });

  } catch (err) {
    console.error('[getMyAttendance]', err.message);
    return sendError(res, 500, 'Failed to fetch attendance');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   PATCH /api/attendance/lock/:workshopId
// @desc    Lock attendance after workshop ends
// @access  Faculty only
// ─────────────────────────────────────────────────────────────────
const lockAttendance = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.workshopId);

    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    workshop.status = 'locked';
    await workshop.save();

    const logs = await AttendanceLog.find({
      workshop_id: workshop._id
    });

    const verified = logs.filter(l => l.verified_status).length;

    return sendSuccess(res, 200, 'Attendance locked successfully', {
      workshop_id: workshop.workshop_id,
      total_scanned: logs.length,
      total_verified: verified
    });

  } catch (err) {
    console.error('[lockAttendance]', err.message);
    return sendError(res, 500, 'Failed to lock attendance');
  }
};
const exportAttendanceExcel = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.workshopId);
    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    // Fetch ONLY verified attendance logs
    const logs = await AttendanceLog.find({
      workshop_id: workshop._id,
      verified_status: true
    }).populate('student_id', 'name roll_number year department email');

    if (!logs.length) {
      return sendError(res, 404, 'No verified students found for this workshop');
    }

    // Generate Excel
// Generate Excel
const { base64, fileName } = await generateAttendanceExcel(workshop, logs);
return sendSuccess(res, 200, 'Excel generated', {
  excel_base64: base64,
  fileName
});

  } catch (err) {
    console.error('[exportAttendanceExcel]', err.message);
    return sendError(res, 500, 'Failed to generate Excel export');
  }
};

module.exports = {
  generateQR,
  scanQR,
  getAttendanceByWorkshop,
  getMyAttendance,
  lockAttendance,
  exportAttendanceExcel  // ← add this
};