const { findTeacherByUserId } = require('../models/teacher.model');

async function resolveTeacherId(req, res, next) {
  try {
    const teacher = await findTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ error: 'You must create a teacher profile first.' });
    }
    req.teacherId = teacher.teacher_id;
    next();
  } catch (err) {
    console.error('ResolveTeacherId error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = resolveTeacherId;