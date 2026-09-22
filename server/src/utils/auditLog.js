const pool = require('../config/db');

// Shared helper for writing to the existing audit_logs table (see
// database/functions.sql and migrations/005) from places other than the
// account-status procedures -- specifically, admin content moderation
// (deleting a post/request/question/answer). Reuses the same table,
// no new schema.
async function logAdminAction(adminId, action, targetType, targetId, details = null) {
  await pool.query(
    `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
  );
}

module.exports = { logAdminAction };
