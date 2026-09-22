const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const {
  getStats,
  getPendingTeachers,
  getAllTeachers,
  getTeacherDetail,
  approveTeacherAccount,
  rejectTeacherAccount,
  getAllStudents,
  suspendAccount,
  activateAccount,
  deleteAccount,
  getAllMatches,
} = require('../controllers/admin.controller');

// Applied once to every route below -- authorization is enforced here on
// the backend, not by hiding the Admin Dashboard link in the React UI.
router.use(verifyToken, requireRole('admin'));

router.get('/stats', getStats);

// Specific routes before the wildcard, same convention as teacher.routes.js
router.get('/teachers/pending', getPendingTeachers);
router.get('/teachers', getAllTeachers);
router.get('/teachers/:userId', getTeacherDetail);
router.post('/teachers/:userId/approve', approveTeacherAccount);
router.post('/teachers/:userId/reject', rejectTeacherAccount);

router.get('/students', getAllStudents);

// Suspend/activate/delete work on any student or teacher account by
// user_id (delete_user_account itself refuses to touch an admin account).
router.post('/users/:userId/suspend', suspendAccount);
router.post('/users/:userId/activate', activateAccount);
router.delete('/users/:userId', deleteAccount);
router.get('/matches', verifyToken, requireRole('admin'), getAllMatches);

module.exports = router;
