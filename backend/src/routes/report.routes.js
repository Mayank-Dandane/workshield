const express = require('express');
const router = express.Router();
const {
  generateWorkshopReport
} = require('../controllers/report.controller');

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// ─── Faculty: Generate full workshop report ────────────────────
router.get(
  '/:workshopId',
  authorize('faculty', 'super_admin'),
  generateWorkshopReport
);

module.exports = router;