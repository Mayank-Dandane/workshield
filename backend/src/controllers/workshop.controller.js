const Workshop = require('../models/Workshop');
const { sendSuccess, sendError } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/workshops
// @desc    Create a new workshop
// @access  Faculty, Super Admin
// ─────────────────────────────────────────────────────────────────
const createWorkshop = async (req, res) => {
  try {
    const {
      title,
      topic,
      speaker,
      date,
      start_time,
      end_time,
      min_duration_minutes,
      random_check_enabled
    } = req.body;

    const workshop = await Workshop.create({
      title,
      topic,
      speaker,
      date: new Date(date),
      start_time,
      end_time,
      min_duration_minutes: Number(min_duration_minutes),
      random_check_enabled: random_check_enabled || false,
      created_by: req.user._id
    });

    return sendSuccess(res, 201, 'Workshop created successfully', { workshop });

  } catch (err) {
    console.error('[createWorkshop]', err.message);
    return sendError(res, 500, 'Failed to create workshop');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/workshops
// @desc    Get all workshops (faculty sees own, admin sees all)
// @access  Faculty, Super Admin
// ─────────────────────────────────────────────────────────────────
const getAllWorkshops = async (req, res) => {
  try {
    let query = {};

    // Faculty only sees their own workshops
    if (req.user.role === 'faculty') {
      query.created_by = req.user._id;
    }

    const workshops = await Workshop.find(query)
      .populate('created_by', 'name email')
      .sort({ date: -1 }); // newest first

    return sendSuccess(res, 200, 'Workshops fetched', {
      count: workshops.length,
      workshops
    });

  } catch (err) {
    console.error('[getAllWorkshops]', err.message);
    return sendError(res, 500, 'Failed to fetch workshops');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/workshops/:id
// @desc    Get single workshop by ID
// @access  Faculty, Super Admin, Student
// ─────────────────────────────────────────────────────────────────
const getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('created_by', 'name email');

    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    return sendSuccess(res, 200, 'Workshop fetched', { workshop });

  } catch (err) {
    console.error('[getWorkshopById]', err.message);
    return sendError(res, 500, 'Failed to fetch workshop');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/workshops/:id
// @desc    Update workshop details
// @access  Faculty, Super Admin
// ─────────────────────────────────────────────────────────────────
const updateWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    // Faculty can only update their own workshops
    if (
      req.user.role === 'faculty' &&
      workshop.created_by.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'Not authorized to update this workshop');
    }

    // Prevent update if workshop is locked
    if (workshop.status === 'locked') {
      return sendError(res, 400, 'Cannot update a locked workshop');
    }

    const updatedWorkshop = await Workshop.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, 200, 'Workshop updated', { workshop: updatedWorkshop });

  } catch (err) {
    console.error('[updateWorkshop]', err.message);
    return sendError(res, 500, 'Failed to update workshop');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   DELETE /api/workshops/:id
// @desc    Delete a workshop
// @access  Super Admin only
// ─────────────────────────────────────────────────────────────────
const deleteWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findByIdAndDelete(req.params.id);

    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    return sendSuccess(res, 200, 'Workshop deleted successfully');

  } catch (err) {
    console.error('[deleteWorkshop]', err.message);
    return sendError(res, 500, 'Failed to delete workshop');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   PATCH /api/workshops/:id/status
// @desc    Update workshop status
// @access  Faculty, Super Admin
// ─────────────────────────────────────────────────────────────────
const updateWorkshopStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['upcoming', 'active', 'completed', 'locked'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    // Faculty can only update their own workshops
    if (
      req.user.role === 'faculty' &&
      workshop.created_by.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'Not authorized to update this workshop');
    }

    workshop.status = status;
    await workshop.save();

    return sendSuccess(res, 200, `Workshop status updated to '${status}'`, { workshop });

  } catch (err) {
    console.error('[updateWorkshopStatus]', err.message);
    return sendError(res, 500, 'Failed to update workshop status');
  }
};

module.exports = {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
  updateWorkshopStatus
};
