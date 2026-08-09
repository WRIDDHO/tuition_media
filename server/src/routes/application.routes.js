const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveStudentId = require('../middleware/resolveStudentId.middleware');
const resolveTeacherId = require('../middleware/resolveTeacherId.middleware');
const {
  applyPost, myPostApplications, viewPostApplications, acceptApplication,
} = require('../controllers/application.controller');

router.post('/posts/apply', verifyToken, requireRole('student'), resolveStudentId, applyPost);
router.get('/posts/mine', verifyToken, requireRole('student'), resolveStudentId, myPostApplications);
router.get('/posts/:postId', verifyToken, requireRole('teacher'), resolveTeacherId, viewPostApplications);
router.put('/posts/:applicationId/accept', verifyToken, requireRole('teacher'), resolveTeacherId, acceptApplication);

module.exports = router;