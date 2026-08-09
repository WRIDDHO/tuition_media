const pool = require('../config/db');

// ---------- Student applies to a Teacher's Post ----------
async function applyToPost(studentId, postId) {
  const result = await pool.query(
    `INSERT INTO teacher_post_applications (post_id, student_id)
     VALUES ($1, $2)
     RETURNING *`,
    [postId, studentId]
  );
  return result.rows[0];
}

async function getApplicationsForPost(postId) {
  const result = await pool.query(
    `SELECT a.*, u.full_name AS student_name
     FROM teacher_post_applications a
     JOIN students s ON s.student_id = a.student_id
     JOIN users u ON u.user_id = s.user_id
     WHERE a.post_id = $1
     ORDER BY a.applied_at DESC`,
    [postId]
  );
  return result.rows;
}

async function getMyPostApplications(studentId) {
  const result = await pool.query(
    `SELECT a.*, tp.title, tp.expected_salary
     FROM teacher_post_applications a
     JOIN teacher_tuition_posts tp ON tp.post_id = a.post_id
     WHERE a.student_id = $1
     ORDER BY a.applied_at DESC`,
    [studentId]
  );
  return result.rows;
}

// ---------- Teacher applies to a Student's Request ----------
async function applyToRequest(teacherId, requestId) {
  const result = await pool.query(
    `INSERT INTO student_request_applications (request_id, teacher_id)
     VALUES ($1, $2)
     RETURNING *`,
    [requestId, teacherId]
  );
  return result.rows[0];
}

async function getApplicationsForRequest(requestId) {
  const result = await pool.query(
    `SELECT a.*, u.full_name AS teacher_name
     FROM student_request_applications a
     JOIN teachers t ON t.teacher_id = a.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE a.request_id = $1
     ORDER BY a.applied_at DESC`,
    [requestId]
  );
  return result.rows;
}

async function getMyRequestApplications(teacherId) {
  const result = await pool.query(
    `SELECT a.*, sr.class_level, sr.salary
     FROM student_request_applications a
     JOIN student_tuition_requests sr ON sr.request_id = a.request_id
     WHERE a.teacher_id = $1
     ORDER BY a.applied_at DESC`,
    [teacherId]
  );
  return result.rows;
}
async function acceptPostApplication(applicationId, teacherId) {
  const result = await pool.query(
    `CALL accept_post_application($1, $2, NULL, NULL, NULL)`,
    [applicationId, teacherId]
  );
  return result.rows[0]; // { out_success, out_message, out_match_id }
}
module.exports = {
  applyToPost, getApplicationsForPost, getMyPostApplications,
  applyToRequest, getApplicationsForRequest, getMyRequestApplications,acceptPostApplication,
};