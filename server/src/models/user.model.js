const pool = require('../config/db');

// Creates the user AND (for student/teacher signups) their profile row,
// in one transaction -- so a half-finished signup (user row with no
// profile) can never happen. profileFields carries the "70%" fields
// collected at signup; the remaining "30%" (hourly_rate, bio) stays
// NULL here and gets filled in later via the existing profile-setup
// pages, whose update calls always resend the full fetched profile
// alongside the new field -- so nothing gets wiped either way.
async function createUser({ fullName, email, passwordHash, role, accountStatus = 'active', profileFields }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, account_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, full_name, email, role, account_status, created_at`,
      [fullName, email, passwordHash, role, accountStatus]
    );
    const user = userResult.rows[0];

    if (role === 'teacher' && profileFields) {
      const {
        qualification, institution, currentLevel, major,
        experienceYears, gender, phone, district, area,
      } = profileFields;
      await client.query(
        `INSERT INTO teachers
           (user_id, qualification, institution, current_level, major,
            experience_years, gender, phone, district, area)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [user.user_id, qualification || null, institution || null, currentLevel || null,
         major || null, experienceYears || 0, gender || null, phone || null,
         district || null, area || null]
      );
    } else if (role === 'student' && profileFields) {
      const { educationLevel, institution, medium, phone, district, area } = profileFields;
      await client.query(
        `INSERT INTO students (user_id, education_level, institution, medium, phone, district, area)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.user_id, educationLevel || null, institution || null, medium || null,
         phone || null, district || null, area || null]
      );
    }

    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
async function reactivateIfSuspensionExpired(userId) {
  const result = await pool.query(
    `CALL reactivate_if_suspension_expired($1, NULL)`,
    [userId]
  );
  return result.rows[0]?.out_reactivated === true;
}
module.exports = { createUser, findUserByEmail, findUserById, updateUser, updateProfilePicture,reactivateIfSuspensionExpired };