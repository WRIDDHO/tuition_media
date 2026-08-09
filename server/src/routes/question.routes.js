const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const { create, listAll, getOne } = require('../controllers/question.controller');

router.get('/', listAll);
router.post('/', verifyToken, upload.single('image'), create);
router.get('/:id', getOne);

module.exports = router;