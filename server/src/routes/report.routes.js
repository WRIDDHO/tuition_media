const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { uploadEvidence } = require('../middleware/upload.middleware');
const { create, listMine, listAboutMe, getOne, explain } = require('../controllers/report.controller');

router.post('/', verifyToken, uploadEvidence.array('evidence', 5), create);
router.get('/mine', verifyToken, listMine);
router.get('/about-me', verifyToken, listAboutMe);
router.get('/:id', verifyToken, getOne);
router.put('/:id/explain', verifyToken, uploadEvidence.array('evidence', 5), explain);

module.exports = router;