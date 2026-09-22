const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveStudentId = require('../middleware/resolveStudentId.middleware');
const { create, listForTeacher, update, remove } = require('../controllers/review.controller');

router.post('/', verifyToken, requireRole('student'), resolveStudentId, create);
router.get('/teacher/:teacherId', listForTeacher);
// Ownership (reviewer_user_id) is enforced in SQL -- no role restriction
// needed at the route level since only the original reviewer's id can
// ever match.
router.put('/:id', verifyToken, requireRole('student'), update);
router.delete('/:id', verifyToken, requireRole('student'), remove);
router.delete('/:id', verifyToken, requireRole('student', 'admin'), remove);
module.exports = router;