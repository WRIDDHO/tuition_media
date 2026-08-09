const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const {
  createProfile,
  getMyProfile,
  updateMyProfile,
  getStudentPublic,
} = require('../controllers/student.controller');

// Specific routes FIRST (mistake we made in Phase 7 — fixed here from the start)
router.post('/me', verifyToken, requireRole('student'), createProfile);
router.get('/me', verifyToken, requireRole('student'), getMyProfile);
router.put('/me', verifyToken, requireRole('student'), updateMyProfile);

// Logged-in only (any role) — NOT fully public, unlike teacher profiles
router.get('/:id', verifyToken, getStudentPublic);

module.exports = router;