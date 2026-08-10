const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { listMine, unreadCount, markOneRead, markAllRead } = require('../controllers/notification.controller');

router.get('/', verifyToken, listMine);
router.get('/unread-count', verifyToken, unreadCount);
router.put('/:id/read', verifyToken, markOneRead);
router.put('/read-all', verifyToken, markAllRead);

module.exports = router;