const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveTeacherId = require('../middleware/resolveTeacherId.middleware');
const {
  create, listAll, getOne, listMine, update, remove,
} = require('../controllers/teacherPost.controller');

// Public
router.get('/', listAll);

// Logged-in teacher only (specific routes BEFORE /:id)
router.post('/', verifyToken, requireRole('teacher'), resolveTeacherId, create);
router.get('/mine', verifyToken, requireRole('teacher'), resolveTeacherId, listMine);
router.put('/:id', verifyToken, requireRole('teacher'), resolveTeacherId, update);
router.delete('/:id', verifyToken, requireRole('teacher'), resolveTeacherId, remove);

// Public wildcard LAST
router.get('/:id', getOne);

module.exports = router;