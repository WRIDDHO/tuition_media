const { findStudentByUserId } = require('../models/student.model');

async function resolveStudentId(req, res, next) {
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