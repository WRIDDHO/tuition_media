const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { listMine, getOne, cancel } = require('../controllers/match.controller');

router.get('/mine', verifyToken, listMine);
router.get('/:id', verifyToken, getOne);
router.put('/:id/cancel', verifyToken, cancel);

module.exports = router;