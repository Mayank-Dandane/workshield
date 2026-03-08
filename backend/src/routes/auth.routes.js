const express = require('express');
const router = express.Router();
const {
  studentLogin,
  facultyLogin,
  getMe,
  logout
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');

// ─── Student Auth ──────────────────────────────────────────────
router.post('/student/login', studentLogin);

// ─── Faculty Auth ──────────────────────────────────────────────
router.post('/faculty/login', facultyLogin);

// ─── Common ───────────────────────────────────────────────────
router.get('/me', protect, getMe);       // get logged in user info
router.post('/logout', protect, logout);

module.exports = router;