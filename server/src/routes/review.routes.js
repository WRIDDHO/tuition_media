const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveStudentId = require('../middleware/resolveStudentId.middleware');
const { create, listForTeacher } = require('../controllers/review.controller');

router.post('/', verifyToken, requireRole('student'), resolveStudentId, create);
router.get('/teacher/:teacherId', listForTeacher);

module.exports = router;