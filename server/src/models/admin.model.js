const pool = require('../config/db');

// ---- Platform statistics ----------------------------------------------

async function getPlatformStats() {
  const result = await pool.query(`SELECT * FROM get_platform_stats()`);
  return result.rows[0];
}

// ---- Teacher verification ----------------------------------------------

async function listPendingTeachers() {
  const result = await pool.query(`SELECT * FROM pending_teacher_verifications`);
  return result.rows;
}

// Paginated list of every teacher regardless of account_status -- this is
// the admin's "all teachers" management view, separate from the public
// /api/teachers/search (which only ever shows active/verified teachers).
async function listAllTeachers(limit, offset) {
  const result = await pool.query(
    `SELECT
        u.user_id, t.teacher_id, u.full_name, u.email, u.account_status, u.created_at,
        t.district, t.area,
        COUNT(*) OVER() AS total_count
     FROM users u
     LEFT JOIN teachers t ON t.user_id = u.user_id
     WHERE u.role = 'teacher'
     ORDER BY u.user_id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

async function getTeacherDetailForAdmin(userId) {
  const result = await pool.query(
    `SELECT
        u.user_id, t.teacher_id, u.full_name, u.email, u.account_status, u.created_at,
        t.qualification, t.institution, t.experience_years, t.hourly_rate,
        t.district, t.area, t.avg_rating, t.total_reviews,
        COALESCE(
            (SELECT JSON_AGG(s.subject_name)
             FROM teacher_subjects ts
             JOIN subjects s ON s.subject_id = ts.subject_id
             WHERE ts.teacher_id = t.teacher_id),
            '[]'::JSON
        ) AS subjects
     FROM users u
     LEFT JOIN teachers t ON t.user_id = u.user_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

// approve_teacher / reject_teacher are PostgreSQL procedures (see
// database/functions.sql). They handle the account_status update and the
// audit_logs entry together, atomically, inside the procedure body --
// the after_account_status_change trigger then queues the teacher's
// notification automatically. Nothing here does that work again.
async function approveTeacher(adminId, teacherUserId) {
  const result = await pool.query(
    `CALL approve_teacher($1, $2, NULL, NULL)`,
    [adminId, teacherUserId]
  );
  return result.rows[0]; // { out_success, out_message }
}

async function rejectTeacher(adminId, teacherUserId, reason) {
  const result = await pool.query(
    `CALL reject_teacher($1, $2, $3, NULL, NULL)`,
    [adminId, teacherUserId, reason || null]
  );
  return result.rows[0];
}
// ---- Student management ----------------------------------------------

async function listAllStudents(limit, offset) {
  const result = await pool.query(
    `SELECT
        u.user_id, s.student_id, u.full_name, u.email, u.account_status, u.created_at,
        s.education_level, s.institution, s.district, s.area,
        COUNT(*) OVER() AS total_count
     FROM users u
     LEFT JOIN students s ON s.user_id = u.user_id
     WHERE u.role = 'student'
     ORDER BY u.user_id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}
// ---- Account status / deletion (any role except admin) ----------------

async function setAccountStatus(adminId, targetUserId, newStatus, reason) {
  const result = await pool.query(
    `CALL set_user_account_status($1, $2, $3, $4, NULL, NULL)`,
    [adminId, targetUserId, newStatus, reason || null]
  );
  return result.rows[0];
}

async function deleteUserAccount(adminId, targetUserId, reason) {
  const result = await pool.query(
    `CALL delete_user_account($1, $2, $3, NULL, NULL)`,
    [adminId, targetUserId, reason || null]
  );
  return result.rows[0];
}
async function listAllMatches(limit, offset) {
  const result = await pool.query(
    `SELECT
        m.match_id, m.status, m.started_at, m.ended_at,
        tu.full_name AS teacher_name,
        su.full_name AS student_name,
        tp.title AS post_title,
        sub.subject_name,
        COUNT(*) OVER() AS total_count
     FROM matches m
     JOIN teachers t ON t.teacher_id = m.teacher_id
     JOIN users tu ON tu.user_id = t.user_id
     JOIN students s ON s.student_id = m.student_id
     JOIN users su ON su.user_id = s.user_id
     LEFT JOIN teacher_tuition_posts tp ON tp.post_id = m.teacher_post_id
     LEFT JOIN student_tuition_requests sr ON sr.request_id = m.student_request_id
     LEFT JOIN subjects sub ON sub.subject_id = COALESCE(tp.subject_id, sr.subject_id)
     ORDER BY m.started_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}
module.exports = {
  getPlatformStats,
  listPendingTeachers,
  listAllTeachers,
  getTeacherDetailForAdmin,
  approveTeacher,
  rejectTeacher,
  listAllStudents,
  setAccountStatus,
  deleteUserAccount,
  listAllMatches,
};
