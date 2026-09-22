const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const { create, accept, update, remove } = require('../controllers/answer.controller');

router.post('/:questionId', verifyToken, upload.single('image'), create);
router.put('/:answerId/accept', verifyToken, accept);
router.put('/:answerId', verifyToken, upload.single('image'), update);
router.delete('/:answerId', verifyToken, remove);

module.exports = router;