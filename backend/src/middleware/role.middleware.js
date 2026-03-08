const { sendError } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────
// authorize(...roles) — restricts route to specific roles
// Usage: router.get('/route', protect, authorize('faculty', 'super_admin'), handler)
// ─────────────────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }

    next();
  };
};

module.exports = { authorize };