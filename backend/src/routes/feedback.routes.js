const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getMyFeedback,
  getFeedbackByWorkshop,
  getFeedbackAnalytics
} = require('../controllers/feedback.controller');

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// ─── Student: Submit feedback ──────────────────────────────────
router.post(
  '/',
  authorize('student'),
  submitFeedback
);

// ─── Student: View own feedback ────────────────────────────────
router.get(
  '/my',
  authorize('student'),
  getMyFeedback
);

// ─── Faculty: View all feedback for a workshop ─────────────────
router.get(
  '/workshop/:workshopId',
  authorize('faculty', 'super_admin'),
  getFeedbackByWorkshop
);

// ─── Faculty: Get feedback analytics for a workshop ───────────
router.get(
  '/analytics/:workshopId',
  authorize('faculty', 'super_admin'),
  getFeedbackAnalytics
);

module.exports = router;