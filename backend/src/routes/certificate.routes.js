const express = require('express');
const router = express.Router();
const {
  generateCertificate,
  downloadCertificate,
  verifyCertificate,
  getMyCertificates
} = require('../controllers/certificate.controller');

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// ─── Student: Generate certificate ────────────────────────────
router.post(
  '/generate',
  protect,
  authorize('student'),
  generateCertificate
);

// ─── Student: Get all my certificates ─────────────────────────
router.get(
  '/my',
  protect,
  authorize('student'),
  getMyCertificates
);

// ─── Student: Download certificate PDF ────────────────────────
router.get(
  '/download/:certificateId',
  protect,
  authorize('student'),
  downloadCertificate
);

// ─── Public: Verify certificate (no login needed) ─────────────
router.get(
  '/verify/:certificateId',
  verifyCertificate
);

module.exports = router;