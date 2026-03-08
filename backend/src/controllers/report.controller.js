const Workshop = require('../models/Workshop');
const AttendanceLog = require('../models/AttendanceLog');
const Feedback = require('../models/Feedback');
const { generateReportPDF } = require('../services/report.service');
const { sendSuccess, sendError } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/reports/:workshopId
// @desc    Generate full workshop report PDF
// @access  Faculty only
// ─────────────────────────────────────────────────────────────────
const generateWorkshopReport = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.workshopId)
      .populate('created_by', 'name department');

    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    // ── Fetch all attendance logs ──────────────────────────────
    const allLogs = await AttendanceLog.find({
      workshop_id: workshop._id
    }).populate('student_id', 'name roll_number year department');

    const verifiedLogs = allLogs.filter(l => l.verified_status);

    // ── Calculate attendance stats ─────────────────────────────
    const totalScanned = allLogs.length;
    const totalVerified = verifiedLogs.length;
    const attendancePercentage = totalScanned > 0
      ? Math.round((totalVerified / totalScanned) * 100)
      : 0;

    // Average duration of verified students
    const avgDuration = verifiedLogs.length > 0
      ? Math.round(
          verifiedLogs.reduce((s, l) => s + l.total_duration_minutes, 0) /
          verifiedLogs.length
        )
      : 0;

    // Early exits — verified but duration close to minimum
    const earlyExits = verifiedLogs.filter(
      l => l.total_duration_minutes < workshop.min_duration_minutes * 1.1
    ).length;

    // No exit scanned
    const noExit = allLogs.filter(l => l.entry_time && !l.exit_time).length;

    // Year-wise breakdown
    const yearWise = {};
    verifiedLogs.forEach(l => {
      const yr = l.student_id?.year || 'Unknown';
      yearWise[yr] = (yearWise[yr] || 0) + 1;
    });

    const attendanceStats = {
      totalScanned,
      totalVerified,
      attendancePercentage,
      avgDuration,
      earlyExits,
      noExit,
      yearWise
    };

    // ── Fetch and calculate feedback stats ─────────────────────
    const feedbacks = await Feedback.find({ workshop_id: workshop._id });
    const feedbackStats = calculateAnalytics(feedbacks);

    // ── Generate PDF ───────────────────────────────────────────
    const { cloudinaryUrl, fileName } = await generateReportPDF({
      workshop: {
        ...workshop.toObject(),
        department: workshop.created_by?.department || 'Computer Science'
      },
      attendanceStats,
      feedbackStats,
      studentLogs: allLogs
    });

    // ── Send PDF ───────────────────────────────────────────────
    return sendSuccess(res, 200, 'Report generated', {
      download_url: cloudinaryUrl,
      fileName
    });
  } catch (err) {
    console.error('[generateWorkshopReport]', err.message);
    return sendError(res, 500, 'Failed to generate report');
  }
};

module.exports = { generateWorkshopReport };