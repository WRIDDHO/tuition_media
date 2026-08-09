const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { listSubjects, addSubject } = require('../controllers/subject.controller');

// Public — anyone can browse the subject list
router.get('/', listSubjects);

// Logged-in only (any role) — add a new subject if missing
router.post('/', verifyToken, addSubject);

module.exports = router;