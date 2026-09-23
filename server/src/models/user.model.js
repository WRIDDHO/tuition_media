const pool = require('../config/db');

async function createUser({ fullName, email, passwordHash, role, accountStatus = 'active' }) {
  // accountStatus defaults to 'active' for backward compatibility, but
  // auth.controller.js always passes it explicitly now: 'active' for
  // students, 'pending' for teachers (Phase 2 teacher verification).
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, account_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, full_name, email, role, account_status, created_at`,
    [fullName, email, passwordHash, role, accountStatus]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
}
async function findUserById(user_id) {
  const result = await pool.query(
    `SELECT user_id, full_name, email, role, created_at, profile_picture
     FROM users WHERE user_id = $1`,
    [user_id]
  );
  return result.rows[0];
}
async function updateUser(user_id,{fullName}) {
  const result = await pool.query(
    `UPDATE users
     SET full_name = $1
     WHERE user_id = $2
     RETURNING user_id, full_name, email, role, created_at`,
    [fullName,user_id]
  );
  return result.rows[0];
}
async function updateProfilePicture(userId, profilePictureUrl) {
  const result = await pool.query(
    `UPDATE users SET profile_picture = $1
     WHERE user_id = $2
     RETURNING user_id, full_name, email, role, profile_picture`,
    [profilePictureUrl, userId]
  );
  return result.rows[0];
}
// Lazily reactivates a temporarily-suspended account if its
// suspended_until has passed. Called at the top of login(), before the
// account_status check -- no scheduler needed, this runs on demand.
async function reactivateIfSuspensionExpired(userId) {
  const result = await pool.query(
    `CALL reactivate_if_suspension_expired($1, NULL)`,
    [userId]
  );
  return result.rows[0]?.out_reactivated === true;
}
module.exports = { createUser, findUserByEmail, findUserById, updateUser, updateProfilePicture,reactivateIfSuspensionExpired };