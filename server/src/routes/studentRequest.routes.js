//fully written by me seeing teacherPost.routes
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveStudentId = require('../middleware/resolveStudentId.middleware');
const {
  create, listAll, getOne, listMine, update, remove,
} = require('../controllers/studentRequest.controller');

// Public
router.get('/', listAll);

// Logged-in teacher only (specific routes BEFORE /:id)
router.post('/', verifyToken, requireRole('student'), resolveStudentId, create);
router.get('/mine', verifyToken, requireRole('student'),resolveStudentId, listMine);
router.put('/:id', verifyToken, requireRole('student'), resolveStudentId, update);
router.delete('/:id', verifyToken, requireRole('student'),resolveStudentId, remove);

// Public wildcard LAST
router.get('/:id', getOne);

module.exports = router;