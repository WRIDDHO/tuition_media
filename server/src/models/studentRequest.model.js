const pool = require('../config/db');

async function createStudentRequest(studentId, data) {
  const {
    subjectId, classLevel, salary, description, preferredInstitution,
    location, mode, categoryName, daysPerWeek, preferredTime,
  } = data;

  const result = await pool.query(
    `INSERT INTO student_tuition_requests
       (student_id, subject_id, class_level, salary, description,
        preferred_institution, location, mode, category_name,
        days_per_week, preferred_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [studentId, subjectId, classLevel, salary, description,
     preferredInstitution, location, mode, categoryName, daysPerWeek, preferredTime]
  );
  return result.rows[0];
}

async function getAllStudentRequests() {
  const result = await pool.query(
    `SELECT sr.*, s.subject_name, u.full_name AS student_name
     FROM student_tuition_requests sr
     JOIN subjects s ON s.subject_id = sr.subject_id
     JOIN students st ON st.student_id = sr.student_id
     JOIN users u ON u.user_id = st.user_id
     WHERE sr.status = 'active'
     ORDER BY sr.posted_at DESC`
  );
  return result.rows;
}

async function getStudentRequestById(requestId) {
  const result = await pool.query(
    `SELECT sr.*, s.subject_name, u.full_name AS student_name
     FROM student_tuition_requests sr
     JOIN subjects s ON s.subject_id = sr.subject_id
     JOIN students st ON st.student_id = sr.student_id
     JOIN users u ON u.user_id = st.user_id
     WHERE sr.request_id = $1`,
    [requestId]
  );
  return result.rows[0];
}

async function getRequestsByStudent(studentId) {
  const result = await pool.query(
    `SELECT sr.*, s.subject_name
     FROM student_tuition_requests sr
     JOIN subjects s ON s.subject_id = sr.subject_id
     WHERE sr.student_id = $1
     ORDER BY sr.posted_at DESC`,
    [studentId]
  );
  return result.rows;
}

async function updateStudentRequest(requestId, studentId, data) {
  const {
    subjectId, classLevel, salary, description, preferredInstitution,
    location, mode, categoryName, daysPerWeek, preferredTime, status,
  } = data;

  const result = await pool.query(
    `UPDATE student_tuition_requests
     SET subject_id = $1, class_level = $2, salary = $3, description = $4,
         preferred_institution = $5, location = $6, mode = $7,
         category_name = $8, days_per_week = $9, preferred_time = $10, status = $11
     WHERE request_id = $12 AND student_id = $13
     RETURNING *`,
    [subjectId, classLevel, salary, description, preferredInstitution,
     location, mode, categoryName, daysPerWeek, preferredTime, status, requestId, studentId]
  );
  return result.rows[0];
}

async function deleteStudentRequest(requestId, studentId) {
  const result = await pool.query(
    `DELETE FROM student_tuition_requests
     WHERE request_id = $1 AND student_id = $2
     RETURNING *`,
    [requestId, studentId]
  );
  return result.rows[0];
}

module.exports = {
  createStudentRequest,
  getAllStudentRequests,
  getStudentRequestById,
  getRequestsByStudent,
  updateStudentRequest,
  deleteStudentRequest,
};