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
    `SELECT tp.*, s.subject_name, u.full_name AS teacher_name, u.user_id AS teacher_user_id
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

// Admin moderation: delete regardless of owner. Only reachable from the
// admin branch in the controller (never exposed to a non-admin request).
async function adminDeleteTeacherPost(postId) {
  const result = await pool.query(
    `DELETE FROM teacher_tuition_posts WHERE post_id = $1 RETURNING *`,
    [postId]
  );
  return result.rows[0];
}
// Search with optional filters -- every filter uses the
// "($n IS NULL OR column = $n)" pattern already established elsewhere
// in this codebase (question.model.js, resource.model.js), so an
// omitted filter never narrows the result set.
async function searchTeacherPosts(filters) {
  const {
    subjectId, location, mode, classLevel,
    minSalary, maxSalary, daysPerWeek, preferredGender, limit,
  } = filters;

  const result = await pool.query(
    `SELECT tp.*, s.subject_name, u.full_name AS teacher_name
     FROM teacher_tuition_posts tp
     JOIN subjects s ON s.subject_id = tp.subject_id
     JOIN teachers t ON t.teacher_id = tp.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE tp.status = 'active'
       AND ($1::INTEGER IS NULL OR tp.subject_id = $1)
       AND ($2::TEXT IS NULL OR tp.location ILIKE '%' || $2 || '%')
       AND ($3::TEXT IS NULL OR tp.mode = $3::mode_type)
       AND ($4::TEXT IS NULL OR tp.class_level = $4)
       AND ($5::INTEGER IS NULL OR tp.expected_salary >= $5)
       AND ($6::INTEGER IS NULL OR tp.expected_salary <= $6)
       AND ($7::INTEGER IS NULL OR tp.days_per_week = $7)
       AND ($8::TEXT IS NULL OR tp.preferred_gender = $8)
     ORDER BY tp.posted_at DESC
     LIMIT $9`,
    [
      subjectId || null, location || null, mode || null, classLevel || null,
      minSalary || null, maxSalary || null, daysPerWeek || null,
      preferredGender || null, limit || 20,
    ]
  );
  return result.rows;
}

module.exports = {
  createTeacherPost,
  getAllTeacherPosts,
  getTeacherPostById,
  getPostsByTeacher,
  updateTeacherPost,
  deleteTeacherPost,
  adminDeleteTeacherPost,
  searchTeacherPosts,
};