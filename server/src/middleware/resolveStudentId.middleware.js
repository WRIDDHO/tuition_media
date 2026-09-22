
const { findStudentByUserId } = require('../models/student.model');

async function resolveStudentId(req, res, next) {
  // Phase 3: an admin moderating a student's content has no student
  // profile of their own -- let them through with studentId left null so
  // the controller can branch on req.user.role instead. This route is
  // only reachable by 'admin' when a route explicitly opts in via
  // requireRole('student', 'admin'); every existing student-only route is
  // unaffected since it never lists 'admin' as an allowed role.
  if (req.user.role === 'admin') {
    req.studentId = null;
    return next();
  }

  try {
    const student = await findStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'You must create a student profile first.' });
    }
    req.studentId = student.student_id;
    next();
  } catch (err) {
    console.error('ResolveStudentId error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = resolveStudentId;