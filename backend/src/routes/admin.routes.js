const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { addStudent, bulkAddStudents, addFaculty, bulkAddFaculty, getAllStudents, getAllFaculty, toggleStudent, toggleFaculty, getStats } = require('../controllers/admin.controller');

const guard = [protect, authorize('super_admin')];

router.get('/stats',                  ...guard, getStats);
router.get('/students',               ...guard, getAllStudents);
router.post('/students',              ...guard, addStudent);
router.post('/students/bulk',         ...guard, bulkAddStudents);
router.patch('/students/:id/toggle',  ...guard, toggleStudent);
router.get('/faculty',                ...guard, getAllFaculty);
router.post('/faculty',               ...guard, addFaculty);
router.post('/faculty/bulk',          ...guard, bulkAddFaculty);
router.patch('/faculty/:id/toggle',   ...guard, toggleFaculty);

module.exports = router;