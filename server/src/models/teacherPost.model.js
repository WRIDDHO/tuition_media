const pool = require('../config/db');

async function createTeacherPost(teacherId, data) {
  const {
    subjectId, title, description, expectedSalary, duration,
    classLevel, location, mode, preferredGender, vacancy,
    daysPerWeek, preferredTime, deadline,
  } = data;

  const result = await pool.query(
    `INSERT INTO teacher_tuition_posts
       (teacher_id, subject_id, title, description, expected_salary, duration,
        class_level, location, mode, preferred_gender, vacancy,
        days_per_week, preferred_time, deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [teacherId, subjectId, title, description, expectedSalary, duration,
     classLevel, location, mode, preferredGender, vacancy,
     daysPerWeek, preferredTime, deadline]
  );
  return result.rows[0];
}

async function getAllTeacherPosts() {
  const result = await pool.query(
    `SELECT tp.*, s.subject_name, u.full_name AS teacher_name
     FROM teacher_tuition_posts tp
     JOIN subjects s ON s.subject_id = tp.subject_id
     JOIN teachers t ON t.teacher_id = tp.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE tp.status = 'active'
     ORDER BY tp.posted_at DESC`
  );
  return result.rows;
}

async function getTeacherPostById(postId) {
  const result = await pool.query(
    `SELECT tp.*, s.subject_name, u.full_name AS teacher_name
     FROM teacher_tuition_posts tp
     JOIN subjects s ON s.subject_id = tp.subject_id
     JOIN teachers t ON t.teacher_id = tp.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE tp.post_id = $1`,
    [postId]
  );
  return result.rows[0];
}

async function getPostsByTeacher(teacherId) {
  const result = await pool.query(
    `SELECT tp.*, s.subject_name
     FROM teacher_tuition_posts tp
     JOIN subjects s ON s.subject_id = tp.subject_id
     WHERE tp.teacher_id = $1
     ORDER BY tp.posted_at DESC`,
    [teacherId]
  );
  return result.rows;
}

async function updateTeacherPost(postId, teacherId, data) {
  const {
    subjectId, title, description, expectedSalary, duration,
    classLevel, location, mode, preferredGender, vacancy,
    daysPerWeek, preferredTime, deadline, status,
  } = data;

  const result = await pool.query(
    `UPDATE teacher_tuition_posts
     SET subject_id = $1, title = $2, description = $3, expected_salary = $4,
         duration = $5, class_level = $6, location = $7, mode = $8,
         preferred_gender = $9, vacancy = $10, days_per_week = $11,
         preferred_time = $12, deadline = $13, status = $14
     WHERE post_id = $15 AND teacher_id = $16
     RETURNING *`,
    [subjectId, title, description, expectedSalary, duration,
     classLevel, location, mode, preferredGender, vacancy,
     daysPerWeek, preferredTime, deadline, status, postId, teacherId]
  );
  return result.rows[0];
}

async function deleteTeacherPost(postId, teacherId) {
  const result = await pool.query(
    `DELETE FROM teacher_tuition_posts
     WHERE post_id = $1 AND teacher_id = $2
     RETURNING *`,
    [postId, teacherId]
  );
  return result.rows[0];
}

module.exports = {
  createTeacherPost,
  getAllTeacherPosts,
  getTeacherPostById,
  getPostsByTeacher,
  updateTeacherPost,
  deleteTeacherPost,
};