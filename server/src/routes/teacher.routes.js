const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const {
  createProfile,
  getMyProfile,
  updateMyProfile,
  getTeacherPublic,
  search,//add in late
} = require('../controllers/teacher.controller');

// Specific routes FIRST
router.post('/me', verifyToken, requireRole('teacher'), createProfile);
router.get('/me', verifyToken, requireRole('teacher'), getMyProfile);
router.put('/me', verifyToken, requireRole('teacher'), updateMyProfile);
router.get('/search', search);//add in late
//functions,sql->before->teacher.controller.js->search>then here
//checking GET http://localhost:5000/api/teachers/search?subject=Math
// Wildcard route LAST
router.get('/:id', getTeacherPublic);

module.exports = router;