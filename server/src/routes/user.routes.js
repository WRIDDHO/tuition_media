const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { getMe, updateMe } = require('../controllers/user.controller');

router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, updateMe);

module.exports = router;