const express = require('express');
const router = express.Router();
const {
  generateQR,
  scanQR,
  getAttendanceByWorkshop,
  getMyAttendance,
  lockAttendance,
  exportAttendanceExcel,
} = require('../controllers/attendance.controller');

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { qrScanLimiter, loginLimiter } = require('../middleware/rateLimit.middleware');

router.use(protect);

// ─── Faculty: Generate QR ──────────────────────────────────────
// Faculty calls this every 25s to get a new rotating QR
router.post(
  '/generate-qr/:workshopId',
  authorize('faculty', 'super_admin'),
  generateQR
);

// ─── Faculty: Export verified attendance as Excel ──────────────
router.get(
  '/export/:workshopId',
  authorize('faculty', 'super_admin'),
  exportAttendanceExcel
);

// ─── Student: Scan QR ─────────────────────────────────────────
// Student submits scanned token
router.post(
  '/scan',
  authorize('student'),
  qrScanLimiter,
  scanQR
);

// ─── Faculty: View attendance for a workshop ──────────────────
router.get(
  '/workshop/:workshopId',
  authorize('faculty', 'super_admin'),
  getAttendanceByWorkshop
);

// ─── Student: View own attendance ─────────────────────────────
router.get(
  '/my',
  authorize('student'),
  getMyAttendance
);

// ─── Faculty: Lock attendance after workshop ends ─────────────
router.patch(
  '/lock/:workshopId',
  authorize('faculty', 'super_admin'),
  lockAttendance
);

module.exports = router;