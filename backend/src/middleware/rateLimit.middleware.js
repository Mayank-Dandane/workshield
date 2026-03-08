const rateLimit = require('express-rate-limit');

// ─── QR Scan Rate Limiter ──────────────────────────────────────
// Max 5 scan attempts per student per minute
const qrScanLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 5,
  keyGenerator: (req) => {
    // Rate limit per user ID, not IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many scan attempts. Please wait a moment.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Login Rate Limiter ────────────────────────────────────────
// Max 10 login attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Try again after 15 minutes.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { qrScanLimiter, loginLimiter };