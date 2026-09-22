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
    `SELECT a.*, tp.title, tp.expected_salary, m.match_id
     FROM teacher_post_applications a
     JOIN teacher_tuition_posts tp ON tp.post_id = a.post_id
     LEFT JOIN matches m
       ON m.teacher_post_id = a.post_id
      AND m.student_id = a.student_id
     WHERE a.student_id = $1
     ORDER BY a.applied_at DESC`,
    [studentId]
  );
  return result.rows;
}

// The teacher who owns the post rejects one of its pending applications.
// Ownership is verified in the same query (JOIN + WHERE), never trusted
// from the request -- a teacher can't reject someone else's applicant by
// guessing an application_id.
async function rejectPostApplication(applicationId, postOwnerTeacherId) {
  const result = await pool.query(
    `UPDATE teacher_post_applications AS a
     SET status = 'rejected'
     FROM teacher_tuition_posts tp
     WHERE a.application_id = $1
       AND a.post_id = tp.post_id
       AND tp.teacher_id = $2
       AND a.status = 'pending'
     RETURNING a.*`,
    [applicationId, postOwnerTeacherId]
  );
  return result.rows[0];
}

// The applying student withdraws their own application, only while it's
// still pending (an accepted/rejected application is history, not
// something to quietly delete).
async function withdrawPostApplication(applicationId, studentId) {
  const result = await pool.query(
    `DELETE FROM teacher_post_applications
     WHERE application_id = $1 AND student_id = $2 AND status = 'pending'
     RETURNING *`,
    [applicationId, studentId]
  );
  return result.rows[0];
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
    `SELECT a.*, sr.class_level, sr.salary, m.match_id
     FROM student_request_applications a
     JOIN student_tuition_requests sr ON sr.request_id = a.request_id
     LEFT JOIN matches m
       ON m.student_request_id = a.request_id
      AND m.teacher_id = a.teacher_id
     WHERE a.teacher_id = $1
     ORDER BY a.applied_at DESC`,
    [teacherId]
  );
  return result.rows;
}

// The student who owns the request rejects one of its pending applications.
async function rejectRequestApplication(applicationId, requestOwnerStudentId) {
  const result = await pool.query(
    `UPDATE student_request_applications AS a
     SET status = 'rejected'
     FROM student_tuition_requests sr
     WHERE a.application_id = $1
       AND a.request_id = sr.request_id
       AND sr.student_id = $2
       AND a.status = 'pending'
     RETURNING a.*`,
    [applicationId, requestOwnerStudentId]
  );
  return result.rows[0];
}

// The applying teacher withdraws their own application, only while pending.
async function withdrawRequestApplication(applicationId, teacherId) {
  const result = await pool.query(
    `DELETE FROM student_request_applications
     WHERE application_id = $1 AND teacher_id = $2 AND status = 'pending'
     RETURNING *`,
    [applicationId, teacherId]
  );
  return result.rows[0];
}

async function acceptPostApplication(applicationId, teacherId) {
  const result = await pool.query(
    `CALL accept_post_application($1, $2, NULL, NULL, NULL)`,
    [applicationId, teacherId]
  );
  return result.rows[0]; // { out_success, out_message, out_match_id }
}

// Mirrors acceptPostApplication for the other side of the marketplace --
// see database/functions.sql: accept_request_application (Phase 3).
async function acceptRequestApplication(applicationId, studentId) {
  const result = await pool.query(
    `CALL accept_request_application($1, $2, NULL, NULL, NULL)`,
    [applicationId, studentId]
  );
  return result.rows[0];
}

module.exports = {
  applyToPost, getApplicationsForPost, getMyPostApplications,
  rejectPostApplication, withdrawPostApplication,
  applyToRequest, getApplicationsForRequest, getMyRequestApplications,
  rejectRequestApplication, withdrawRequestApplication,
  acceptPostApplication, acceptRequestApplication,
};