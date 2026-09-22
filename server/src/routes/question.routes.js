const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const requireRole = require('../middleware/role.middleware');
const { create, listAll, getOne, update, remove } = require('../controllers/question.controller');

router.get('/', listAll);
router.post('/', verifyToken, upload.single('image'), create);
router.put('/:id', verifyToken, upload.single('image'), update);
// Every role can reach this route (asker or admin) -- the controller
// itself decides asker-owns-it vs. admin-moderates, since there's no
// role to exclude at the route level here.
router.delete('/:id', verifyToken, remove);
router.get('/:id', getOne);
router.post('/', verifyToken, requireRole('student', 'teacher'), upload.single('image'), create);
router.put('/:id', verifyToken, requireRole('student', 'teacher'), upload.single('image'), update);
// delete route অপরিবর্তিত — সেটা owner+admin দুজনের জন্যই দরকার
router.delete('/:id', verifyToken, remove);
module.exports = router;