const pool = require('../config/db');

async function createStudentProfile(userId, data) {
  const { educationLevel, institution, medium, bio, phone, district, area } = data;

  const result = await pool.query(
    `INSERT INTO students
       (user_id, education_level, institution, medium, bio, phone, district, area)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, educationLevel, institution, medium, bio, phone, district, area]
  );
  return result.rows[0];
}

async function findStudentByUserId(userId) {
  const result = await pool.query(
    `SELECT s.*, u.full_name, u.email
     FROM students s
     JOIN users u ON u.user_id = s.user_id
     WHERE s.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function findStudentById(studentId) {
  const result = await pool.query(
    `SELECT s.*, u.full_name, u.email
     FROM students s
     JOIN users u ON u.user_id = s.user_id
     WHERE s.student_id = $1`,
    [studentId]
  );
  return result.rows[0];
}

async function updateStudentProfile(userId, data) {
  const { educationLevel, institution, medium, bio, phone, district, area } = data;

  const result = await pool.query(
    `UPDATE students
     SET education_level = $1, institution = $2, medium = $3,
         bio = $4, phone = $5, district = $6, area = $7
     WHERE user_id = $8
     RETURNING *`,
    [educationLevel, institution, medium, bio, phone, district, area, userId]
  );
  return result.rows[0];
}

module.exports = {
  createStudentProfile,
  findStudentByUserId,
  findStudentById,
  updateStudentProfile,
};