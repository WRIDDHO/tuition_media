const pool = require('../config/db');

async function getPlatformStats() {
  const result = await pool.query(`SELECT * FROM get_platform_stats()`);
  return result.rows[0];
}

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
// ---------------------------------------------------------------------
// Reports / moderation
// ---------------------------------------------------------------------

const REPORT_ADMIN_SELECT_SQL = `
  SELECT
      r.report_id, r.match_id, r.reason, r.description, r.status,
      r.explanation, r.explanation_requested_at, r.explanation_deadline,
      r.explanation_submitted_at, r.resolution_action, r.resolution_note,
      r.resolved_at, r.created_at,
      reporter.full_name AS reporter_name, reporter.user_id AS reporter_user_id,
      reported.full_name AS reported_name, reported.user_id AS reported_user_id,
      m.status AS match_status
  FROM reports r
  JOIN users reporter ON reporter.user_id = r.reporter_user_id
  JOIN users reported ON reported.user_id = r.reported_user_id
  JOIN matches m ON m.match_id = r.match_id
`;

// status = null lists every report; otherwise filters to one status
// (or an array of statuses, e.g. the "waiting" bucket = pending + under_review).
async function listReportsByStatus(statusFilter, limit, offset) {
  const statuses = statusFilter
    ? (Array.isArray(statusFilter) ? statusFilter : [statusFilter])
    : null;

  const result = await pool.query(
    `${REPORT_ADMIN_SELECT_SQL}
     WHERE ($1::VARCHAR[] IS NULL OR r.status = ANY($1))
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [statuses, limit, offset]
  );
  return result.rows;
}

async function getReportDetailForAdmin(reportId) {
  const result = await pool.query(
    `${REPORT_ADMIN_SELECT_SQL} WHERE r.report_id = $1`,
    [reportId]
  );
  return result.rows[0];
}

// Counts for the admin dashboard's Reports tab -- one query, all six
// buckets, straight from the real table (never hardcoded).
async function getReportStats() {
  const result = await pool.query(
    `SELECT
        COUNT(*) FILTER (WHERE status = 'pending')                AS pending,
        COUNT(*) FILTER (WHERE status = 'under_review')           AS under_review,
        COUNT(*) FILTER (WHERE status = 'explanation_requested')  AS waiting_for_explanation,
        COUNT(*) FILTER (WHERE status = 'explanation_received')   AS explanation_received,
        COUNT(*) FILTER (WHERE status = 'resolved')                AS resolved,
        COUNT(*) FILTER (WHERE status = 'dismissed')                AS dismissed
     FROM reports`
  );
  return result.rows[0];
}

// Admin opens a pending report and starts investigating -- a cheap
// status bump with no other side effects, so it doesn't need a
// procedure of its own.
async function markUnderReview(reportId) {
  const result = await pool.query(
    `UPDATE reports SET status = 'under_review'
     WHERE report_id = $1 AND status = 'pending'
     RETURNING *`,
    [reportId]
  );
  return result.rows[0];
}

async function requestExplanationForReport(adminId, reportId, deadlineHours) {
  const result = await pool.query(
    `CALL request_report_explanation($1, $2, $3, NULL, NULL)`,
    [adminId, reportId, deadlineHours]
  );
  return result.rows[0];
}

async function resolveReportAsAdmin(adminId, reportId, action, note, suspensionDays) {
  const result = await pool.query(
    `CALL resolve_report($1, $2, $3, $4, $5, NULL, NULL)`,
    [adminId, reportId, action, note, suspensionDays || null]
  );
  return result.rows[0];
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
  listReportsByStatus,
  getReportDetailForAdmin,
  getReportStats,
  markUnderReview,
  requestExplanationForReport,
  resolveReportAsAdmin,
};
