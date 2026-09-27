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

router.post('/me', verifyToken, requireRole('student'), createProfile);
router.get('/me', verifyToken, requireRole('student'), getMyProfile);
router.put('/me', verifyToken, requireRole('student'), updateMyProfile);

router.get('/:id', verifyToken, getStudentPublic);

module.exports = router;