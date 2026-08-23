const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { uploadProfilePicture } = require('../middleware/upload.middleware');
const { getMe, updateMe, uploadPicture } = require('../controllers/user.controller');

router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, updateMe);
router.put('/me/picture', verifyToken, uploadProfilePicture.single('image'), uploadPicture);

module.exports = router;