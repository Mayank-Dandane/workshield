const rateLimit = require('express-rate-limit');

// ── QR Scan limiter ───────────────────────────────────────────────
// Students scan entry + exit = 2 scans minimum
// Allow 30 per minute per IP to handle retries and simultaneous scans
const qrScanLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 500,                   // was 5 — too low for classroom use
  message: { success: false, message: 'Too many scan attempts, please wait a moment' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Login limiter ─────────────────────────────────────────────────
// 130 students logging in simultaneously needs a high limit
// 20 per minute per IP is safe (most students on different IPs/phones)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   // 5 minutes (was 15)
  max: 20,                   // was 10 — too low for classroom use
  message: { success: false, message: 'Too many login attempts, please try again in 5 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { qrScanLimiter, loginLimiter };