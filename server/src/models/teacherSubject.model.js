const pool = require('../config/db');

async function addSubjectToTeacher(teacherId, subjectId, proficiencyLevel) {
  const result = await pool.query(
    `INSERT INTO teacher_subjects (teacher_id, subject_id, proficiency_level)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [teacherId, subjectId, proficiencyLevel]
  );
  return result.rows[0];
}

async function getSubjectsByTeacher(teacherId) {
  const result = await pool.query(
    `SELECT ts.proficiency_level, s.subject_id, s.subject_name, s.category
     FROM teacher_subjects ts
     JOIN subjects s ON s.subject_id = ts.subject_id
     WHERE ts.teacher_id = $1`,
    [teacherId]
  );
  return result.rows;
}

async function removeSubjectFromTeacher(teacherId, subjectId) {
  const result = await pool.query(
    `DELETE FROM teacher_subjects
     WHERE teacher_id = $1 AND subject_id = $2
     RETURNING *`,
    [teacherId, subjectId]
  );
  return result.rows[0];
}

module.exports = { addSubjectToTeacher, getSubjectsByTeacher, removeSubjectFromTeacher };