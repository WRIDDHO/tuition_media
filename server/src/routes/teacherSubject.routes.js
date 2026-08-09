const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveTeacherId = require('../middleware/resolveTeacherId.middleware');
const { addSubject, listMySubjects, removeSubject } = require('../controllers/teacherSubject.controller');

router.post('/', verifyToken, requireRole('teacher'), resolveTeacherId, addSubject);
router.get('/', verifyToken, requireRole('teacher'), resolveTeacherId, listMySubjects);
router.delete('/:subjectId', verifyToken, requireRole('teacher'), resolveTeacherId, removeSubject);

module.exports = router;