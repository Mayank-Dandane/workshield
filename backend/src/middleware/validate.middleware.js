const { sendError } = require('../utils/response.util');

// ─── Student Login Validator ───────────────────────────────────
const validateStudentLogin = (req, res, next) => {
  const { roll_number, dob, email, password } = req.body;

  const hasRollDOB = roll_number && dob;
  const hasEmailPass = email && password;

  if (!hasRollDOB && !hasEmailPass) {
    return sendError(
      res,
      400,
      'Provide either (roll_number + dob) or (email + password)'
    );
  }
  next();
};

// ─── Faculty Login Validator ───────────────────────────────────
const validateFacultyLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required');
  }
  next();
};

// ─── Workshop Create Validator ─────────────────────────────────
const validateWorkshopCreate = (req, res, next) => {
  const { title, topic, speaker, date, start_time, end_time, min_duration_minutes } = req.body;

  if (!title || !topic || !speaker || !date || !start_time || !end_time || !min_duration_minutes) {
    return sendError(res, 400, 'All workshop fields are required');
  }

  if (isNaN(Number(min_duration_minutes)) || Number(min_duration_minutes) <= 0) {
    return sendError(res, 400, 'min_duration_minutes must be a positive number');
  }

  next();
};

module.exports = {
  validateStudentLogin,
  validateFacultyLogin,
  validateWorkshopCreate
};