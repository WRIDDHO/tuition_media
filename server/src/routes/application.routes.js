const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveStudentId = require('../middleware/resolveStudentId.middleware');
const resolveTeacherId = require('../middleware/resolveTeacherId.middleware');
const {
  applyPost, myPostApplications, viewPostApplications, acceptApplication,
  rejectApplication, withdrawApplication,
  applyRequest, myRequestApplications, viewRequestApplications,
  acceptRequestApplication, rejectRequestApplication, withdrawRequestApplication,
} = require('../controllers/application.controller');

// ---- Post-side: student applies to a teacher's post ----
router.post('/posts/apply', verifyToken, requireRole('student'), resolveStudentId, applyPost);
router.get('/posts/mine', verifyToken, requireRole('student'), resolveStudentId, myPostApplications);
router.delete('/posts/:applicationId', verifyToken, requireRole('student'), resolveStudentId, withdrawApplication);
router.get('/posts/:postId', verifyToken, requireRole('teacher'), resolveTeacherId, viewPostApplications);
router.put('/posts/:applicationId/accept', verifyToken, requireRole('teacher'), resolveTeacherId, acceptApplication);
router.put('/posts/:applicationId/reject', verifyToken, requireRole('teacher'), resolveTeacherId, rejectApplication);

// ---- Request-side: teacher applies to a student's request ----
router.post('/requests/apply', verifyToken, requireRole('teacher'), resolveTeacherId, applyRequest);
router.get('/requests/mine', verifyToken, requireRole('teacher'), resolveTeacherId, myRequestApplications);
router.delete('/requests/:applicationId', verifyToken, requireRole('teacher'), resolveTeacherId, withdrawRequestApplication);
router.get('/requests/:requestId', verifyToken, requireRole('student'), resolveStudentId, viewRequestApplications);
router.put('/requests/:applicationId/accept', verifyToken, requireRole('student'), resolveStudentId, acceptRequestApplication);
router.put('/requests/:applicationId/reject', verifyToken, requireRole('student'), resolveStudentId, rejectRequestApplication);

module.exports = router;
