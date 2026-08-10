const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveStudentId = require('../middleware/resolveStudentId.middleware');
const { toggle, listMine } = require('../controllers/bookmark.controller');

router.post('/:resourceId/toggle', verifyToken, requireRole('student'), resolveStudentId, toggle);
router.get('/', verifyToken, requireRole('student'), resolveStudentId, listMine);

module.exports = router;