const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { generateToken } = require('../config/jwt');
const { sendSuccess, sendError } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/auth/student/login
// @desc    Student login via roll number + DOB OR email + password
// @access  Public
// ─────────────────────────────────────────────────────────────────
const studentLogin = async (req, res) => {
  try {
    const { roll_number, dob, email, password } = req.body;

    let student;

    if (roll_number && dob) {
      // Login via Roll Number + DOB
      student = await Student.findOne({
        roll_number: roll_number.toUpperCase(),
        is_active: true
      });

      if (!student) {
        return sendError(res, 401, 'Invalid roll number or account inactive');
      }

      // Compare DOB
      const inputDOB = new Date(dob).toDateString();
      const storedDOB = new Date(student.dob).toDateString();

      if (inputDOB !== storedDOB) {
        return sendError(res, 401, 'Invalid date of birth');
      }

    } else if (email && password) {
      // Login via Email + Password
      student = await Student.findOne({
        email: email.toLowerCase(),
        is_active: true
      });

      if (!student) {
        return sendError(res, 401, 'Invalid email or account inactive');
      }

      const isMatch = await student.comparePassword(password);
      if (!isMatch) {
        return sendError(res, 401, 'Invalid password');
      }

    } else {
      return sendError(res, 400, 'Provide roll number + DOB or email + password');
    }

    // Generate JWT
    const token = generateToken({
      id: student._id,
      role: 'student'
    });

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: student._id,
        name: student.name,
        roll_number: student.roll_number,
        email: student.email,
        year: student.year,
        department: student.department,
        role: 'student'
      }
    });

  } catch (err) {
    console.error('[studentLogin]', err.message);
    return sendError(res, 500, 'Server error during student login');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/auth/faculty/login
// @desc    Faculty login via email + password
// @access  Public
// ─────────────────────────────────────────────────────────────────
const facultyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    const faculty = await Faculty.findOne({
      email: email.toLowerCase(),
      is_active: true
    });

    if (!faculty) {
      return sendError(res, 401, 'Invalid credentials or account inactive');
    }

    const isMatch = await faculty.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid password');
    }

    // Generate JWT
    const token = generateToken({
      id: faculty._id,
      role: faculty.role  // 'faculty' or 'super_admin'
    });

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        role: faculty.role
      }
    });

  } catch (err) {
    console.error('[facultyLogin]', err.message);
    return sendError(res, 500, 'Server error during faculty login');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently logged in user
// @access  Private (any role)
// ─────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    return sendSuccess(res, 200, 'User fetched', { user: req.user });
  } catch (err) {
    return sendError(res, 500, 'Could not fetch user');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Logout (client discards token)
// @access  Private
// ─────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  // JWT is stateless — client just deletes the token
  return sendSuccess(res, 200, 'Logged out successfully');
};

module.exports = { studentLogin, facultyLogin, getMe, logout };