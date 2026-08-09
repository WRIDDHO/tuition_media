const pool = require('../config/db');

async function createTeacherProfile(userId, data) {
  const {
    qualification, institution, currentLevel, major,
    experienceYears, gender, hourlyRate, district, area, phone,
  } = data;

  const result = await pool.query(
    `INSERT INTO teachers
       (user_id, qualification, institution, current_level, major,
        experience_years, gender, hourly_rate, district, area, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [userId, qualification, institution, currentLevel, major,
     experienceYears, gender, hourlyRate, district, area, phone]
  );
  return result.rows[0];
}

async function findTeacherByUserId(userId) {
  const result = await pool.query(
    `SELECT t.*, u.full_name, u.email
     FROM teachers t
     JOIN users u ON u.user_id = t.user_id
     WHERE t.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function findTeacherById(teacherId) {
  const result = await pool.query(
    `SELECT t.*, u.full_name, u.email
     FROM teachers t
     JOIN users u ON u.user_id = t.user_id
     WHERE t.teacher_id = $1`,
    [teacherId]
  );
  return result.rows[0];
}

async function updateTeacherProfile(userId, data) {
  const {
    qualification, institution, currentLevel, major,
    experienceYears, gender, hourlyRate, district, area, phone,
  } = data;

  const result = await pool.query(
    `UPDATE teachers
     SET qualification = $1, institution = $2, current_level = $3, major = $4,
         experience_years = $5, gender = $6, hourly_rate = $7,
         district = $8, area = $9, phone = $10
     WHERE user_id = $11
     RETURNING *`,
    [qualification, institution, currentLevel, major,
     experienceYears, gender, hourlyRate, district, area, phone, userId]
  );
  return result.rows[0];
}
async function searchTeachers(filters) {
  const { subjectName, district, gender, minRate, maxRate, limit } = filters;
  const result = await pool.query(
    `SELECT * FROM search_teachers($1, $2, $3, $4, $5, $6)`,
    [subjectName || null, district || null, gender || null, minRate || null, maxRate || null, limit || 20]
  );
  return result.rows;
}
module.exports = {
  createTeacherProfile,
  findTeacherByUserId,
  findTeacherById,
  updateTeacherProfile,
  searchTeachers
};