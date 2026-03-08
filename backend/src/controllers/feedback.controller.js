const Feedback = require('../models/Feedback');
const AttendanceLog = require('../models/AttendanceLog');
const Workshop = require('../models/Workshop');
const { calculateAnalytics } = require('../services/feedback.service');
const { sendSuccess, sendError } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/feedback
// @desc    Student submits feedback (only if verified)
// @access  Student only
// ─────────────────────────────────────────────────────────────────
const submitFeedback = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { workshop_id, ratings, comments, suggestions } = req.body;

    // ── Validate required fields ───────────────────────────────
    if (!workshop_id || !ratings || !Array.isArray(ratings) || !ratings.length) {
      return sendError(res, 400, 'workshop_id and ratings array are required');
    }

    // ── Check workshop exists ──────────────────────────────────
    const workshop = await Workshop.findById(workshop_id);
    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    // ── Check attendance is verified ───────────────────────────
    const attendanceLog = await AttendanceLog.findOne({
      student_id: studentId,
      workshop_id
    });

    if (!attendanceLog) {
      return sendError(
        res,
        403,
        'No attendance record found for this workshop'
      );
    }

    if (!attendanceLog.verified_status) {
      return sendError(
        res,
        403,
        'Your attendance is not verified. Feedback can only be submitted after verified attendance.'
      );
    }

    // ── Check already submitted ────────────────────────────────
    const existing = await Feedback.findOne({
      student_id: studentId,
      workshop_id
    });

    if (existing) {
      return sendError(
        res,
        400,
        'You have already submitted feedback for this workshop'
      );
    }

    // ── Validate ratings format ────────────────────────────────
    for (const r of ratings) {
      if (!r.question || !r.score) {
        return sendError(res, 400, 'Each rating must have question and score');
      }
      if (r.score < 1 || r.score > 5) {
        return sendError(res, 400, `Score must be between 1 and 5. Got: ${r.score}`);
      }
    }

    // ── Calculate overall rating (avg of all scores) ───────────
    const overall_rating =
      ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

    // ── Save feedback ──────────────────────────────────────────
    const feedback = await Feedback.create({
      student_id: studentId,
      workshop_id,
      ratings,
      overall_rating: parseFloat(overall_rating.toFixed(2)),
      comments: comments || '',
      suggestions: suggestions || ''
    });

    return sendSuccess(res, 201, 'Feedback submitted successfully', {
      feedback_id: feedback._id,
      overall_rating: feedback.overall_rating,
      message: '🎉 Thank you! Your certificate is now ready to download.'
    });

  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 400, 'Feedback already submitted for this workshop');
    }
    console.error('[submitFeedback]', err.message);
    return sendError(res, 500, 'Failed to submit feedback');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/feedback/my
// @desc    Student views their own feedback submissions
// @access  Student only
// ─────────────────────────────────────────────────────────────────
const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      student_id: req.user._id
    })
      .populate('workshop_id', 'title date workshop_id')
      .sort({ submitted_at: -1 });

    return sendSuccess(res, 200, 'Your feedback records', {
      total: feedbacks.length,
      feedbacks
    });

  } catch (err) {
    console.error('[getMyFeedback]', err.message);
    return sendError(res, 500, 'Failed to fetch feedback');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/feedback/workshop/:workshopId
// @desc    Faculty views all feedback for a workshop
// @access  Faculty only
// ─────────────────────────────────────────────────────────────────
const getFeedbackByWorkshop = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      workshop_id: req.params.workshopId
    })
      .populate('student_id', 'name roll_number year')
      .sort({ submitted_at: -1 });

    return sendSuccess(res, 200, 'Workshop feedback fetched', {
      total: feedbacks.length,
      feedbacks
    });

  } catch (err) {
    console.error('[getFeedbackByWorkshop]', err.message);
    return sendError(res, 500, 'Failed to fetch feedback');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/feedback/analytics/:workshopId
// @desc    Faculty gets feedback analytics
// @access  Faculty only
// ─────────────────────────────────────────────────────────────────
const getFeedbackAnalytics = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      workshop_id: req.params.workshopId
    });

    const analytics = calculateAnalytics(feedbacks);

    return sendSuccess(res, 200, 'Feedback analytics', {
      workshop_id: req.params.workshopId,
      ...analytics
    });

  } catch (err) {
    console.error('[getFeedbackAnalytics]', err.message);
    return sendError(res, 500, 'Failed to generate analytics');
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback,
  getFeedbackByWorkshop,
  getFeedbackAnalytics
};