const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const {
  createProfile,
  getMyProfile,
  updateMyProfile,
  getTeacherPublic,
} = require('../controllers/teacher.controller');

// Specific routes FIRST
router.post('/me', verifyToken, requireRole('teacher'), createProfile);
router.get('/me', verifyToken, requireRole('teacher'), getMyProfile);
router.put('/me', verifyToken, requireRole('teacher'), updateMyProfile);

// Wildcard route LAST
router.get('/:id', getTeacherPublic);

module.exports = router;