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

async function searchStudentRequests(filters) {
  const {
    subjectId, location, mode, categoryName, classLevel,
    minSalary, maxSalary, daysPerWeek, preferredInstitution, limit,
  } = filters;

  const result = await pool.query(
    `SELECT sr.*, s.subject_name, u.full_name AS student_name
     FROM student_tuition_requests sr
     JOIN subjects s ON s.subject_id = sr.subject_id
     JOIN students st ON st.student_id = sr.student_id
     JOIN users u ON u.user_id = st.user_id
     WHERE sr.status = 'active'
       AND ($1::INTEGER IS NULL OR sr.subject_id = $1)
       AND ($2::TEXT IS NULL OR sr.location ILIKE '%' || $2 || '%')
       AND ($3::TEXT IS NULL OR sr.mode = $3::mode_type)
       AND ($4::TEXT IS NULL OR sr.category_name = $4)
       AND ($5::TEXT IS NULL OR sr.class_level = $5)
       AND ($6::INTEGER IS NULL OR sr.salary >= $6)
       AND ($7::INTEGER IS NULL OR sr.salary <= $7)
       AND ($8::INTEGER IS NULL OR sr.days_per_week = $8)
       AND ($9::TEXT IS NULL OR sr.preferred_institution ILIKE '%' || $9 || '%')
     ORDER BY sr.posted_at DESC
     LIMIT $10`,
    [
      subjectId || null, location || null, mode || null, categoryName || null,
      classLevel || null, minSalary || null, maxSalary || null,
      daysPerWeek || null, preferredInstitution || null, limit || 20,
    ]
  );
  return result.rows;
}
async function getStudentRequestById(requestId) {
  const result = await pool.query(
    `SELECT sr.*, s.subject_name, u.full_name AS student_name, u.user_id AS student_user_id
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

// Admin moderation: delete regardless of owner.
async function adminDeleteStudentRequest(requestId) {
  const result = await pool.query(
    `DELETE FROM student_tuition_requests WHERE request_id = $1 RETURNING *`,
    [requestId]
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
  adminDeleteStudentRequest,
  searchStudentRequests,
};