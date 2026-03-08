const express = require('express');
const router = express.Router();
const {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
  updateWorkshopStatus
} = require('../controllers/workshop.controller');

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateWorkshopCreate } = require('../middleware/validate.middleware');

// ─── All routes require login ──────────────────────────────────
router.use(protect);

// ─── Faculty & Admin only ──────────────────────────────────────
router.post(
  '/',
  authorize('faculty', 'super_admin'),
  validateWorkshopCreate,
  createWorkshop
);

router.get(
  '/',
  authorize('faculty', 'super_admin'),
  getAllWorkshops
);

router.get(
  '/:id',
  authorize('faculty', 'super_admin', 'student'),
  getWorkshopById
);

router.put(
  '/:id',
  authorize('faculty', 'super_admin'),
  updateWorkshop
);

router.delete(
  '/:id',
  authorize('super_admin'),
  deleteWorkshop
);

// ─── Update workshop status (active/completed/locked) ──────────
router.patch(
  '/:id/status',
  authorize('faculty', 'super_admin'),
  updateWorkshopStatus
);

module.exports = router;