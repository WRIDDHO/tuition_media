const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const resolveTeacherId = require('../middleware/resolveTeacherId.middleware');
const { uploadResource } = require('../middleware/upload.middleware');
const { create, listAll, getOne, listMine, download, remove } = require('../controllers/resource.controller');

router.get('/', listAll);
router.get('/mine', verifyToken, requireRole('teacher'), resolveTeacherId, listMine);
router.post('/', verifyToken, requireRole('teacher'), resolveTeacherId, uploadResource.single('file'), create);
router.get('/:id/download', download);
router.delete('/:id', verifyToken, requireRole('teacher'), resolveTeacherId, remove);
router.get('/:id', getOne);

module.exports = router;