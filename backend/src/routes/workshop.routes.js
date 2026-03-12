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

const { protect }                = require('../middleware/auth.middleware');
const { authorize }              = require('../middleware/role.middleware');
const { validateWorkshopCreate } = require('../middleware/validate.middleware');
const Workshop                   = require('../models/Workshop');
const { generateWorkshopReport } = require('../utils/reportGenerator');

// ─── All routes require login ──────────────────────────────────────────────────
router.use(protect);

// ─── Faculty & Admin only ──────────────────────────────────────────────────────
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

// ─── Update workshop status (active / completed / locked) ─────────────────────
router.patch(
  '/:id/status',
  authorize('faculty', 'super_admin'),
  updateWorkshopStatus
);

// ─── Download workshop report as .docx ────────────────────────────────────────
router.get(
  '/:id/report',
  authorize('faculty', 'super_admin'),
  async (req, res) => {
    try {
      const workshop = await Workshop.findById(req.params.id);
      if (!workshop) {
        return res.status(404).json({ success: false, message: 'Workshop not found' });
      }

      const buffer = await generateWorkshopReport(workshop);

      // Sanitize title for filename
      const safeTitle = (workshop.title || 'Workshop')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${workshop.workshop_id}_${safeTitle}_Report.docx"`
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.send(buffer);

    } catch (err) {
      console.error('Report generation error:', err);
      res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
  }
);

module.exports = router;