const { verifyToken } = require('../config/jwt');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { sendError } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────
// protect — verifies JWT and attaches user to req.user
// ─────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    // Verify token
    const decoded = verifyToken(token); // throws if invalid/expired

    // Fetch user based on role in token
    let user;

    if (decoded.role === 'student') {
      user = await Student.findById(decoded.id).select('-password_hash');
      if (!user || !user.is_active) {
        return sendError(res, 401, 'Student not found or inactive');
      }
      user = { ...user.toObject(), role: 'student' };

    } else if (decoded.role === 'faculty' || decoded.role === 'super_admin') {
      user = await Faculty.findById(decoded.id).select('-password_hash');
      if (!user || !user.is_active) {
        return sendError(res, 401, 'Faculty not found or inactive');
      }
      user = { ...user.toObject(), role: user.role };

    } else {
      return sendError(res, 401, 'Invalid token role');
    }

    req.user = user;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please login again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token. Please login again.');
    }
    return sendError(res, 500, 'Authentication error');
  }
};

module.exports = { protect };