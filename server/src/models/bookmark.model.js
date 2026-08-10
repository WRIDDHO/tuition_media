const pool = require('../config/db');

async function findBookmark(studentId, resourceId) {
  const result = await pool.query(
    `SELECT * FROM resource_bookmarks WHERE student_id = $1 AND resource_id = $2`,
    [studentId, resourceId]
  );
  return result.rows[0];
}

async function addBookmark(studentId, resourceId) {
  const result = await pool.query(
    `INSERT INTO resource_bookmarks (student_id, resource_id)
     VALUES ($1, $2)
     RETURNING *`,
    [studentId, resourceId]
  );
  return result.rows[0];
}

async function removeBookmark(studentId, resourceId) {
  const result = await pool.query(
    `DELETE FROM resource_bookmarks WHERE student_id = $1 AND resource_id = $2 RETURNING *`,
    [studentId, resourceId]
  );
  return result.rows[0];
}

async function getMyBookmarks(studentId) {
  const result = await pool.query(
    `SELECT b.created_at, r.resource_id, r.title, r.file_url, r.file_type, s.subject_name, u.full_name AS teacher_name
     FROM resource_bookmarks b
     JOIN resources r ON r.resource_id = b.resource_id
     JOIN subjects s ON s.subject_id = r.subject_id
     JOIN teachers t ON t.teacher_id = r.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE b.student_id = $1
     ORDER BY b.created_at DESC`,
    [studentId]
  );
  return result.rows;
}

module.exports = { findBookmark, addBookmark, removeBookmark, getMyBookmarks };