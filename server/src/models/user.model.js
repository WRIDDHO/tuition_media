const pool = require('../config/db');

async function createUser({ fullName, email, passwordHash, role }) {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, full_name, email, role, created_at`,
    [fullName, email, passwordHash, role]
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
    `SELECT user_id, full_name, email, role, created_at
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
module.exports = { createUser, findUserByEmail,findUserById,updateUser };