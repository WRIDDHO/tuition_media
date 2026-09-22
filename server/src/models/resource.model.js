const pool = require('../config/db');

async function createResource(teacherId, data) {
  const { subjectId, classLevel, title, description, fileUrl, fileType } = data;

  const result = await pool.query(
    `INSERT INTO resources (teacher_id, subject_id, class_level, title, description, file_url, file_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [teacherId, subjectId, classLevel, title, description, fileUrl, fileType]
  );
  return result.rows[0];
}

async function getAllResources(subjectId) {
  const result = await pool.query(
    `SELECT r.*, s.subject_name, u.full_name AS teacher_name, u.user_id AS teacher_user_id
     FROM resources r
     JOIN subjects s ON s.subject_id = r.subject_id
     JOIN teachers t ON t.teacher_id = r.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE ($1::INTEGER IS NULL OR r.subject_id = $1)
     ORDER BY r.uploaded_at DESC`,
    [subjectId || null]
  );
  return result.rows;
}

async function getResourceById(resourceId) {
  const result = await pool.query(
    `SELECT r.*, s.subject_name, u.full_name AS teacher_name, u.user_id AS teacher_user_id
     FROM resources r
     JOIN subjects s ON s.subject_id = r.subject_id
     JOIN teachers t ON t.teacher_id = r.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE r.resource_id = $1`,
    [resourceId]
  );
  return result.rows[0];
}

async function getResourcesByTeacher(teacherId) {
  const result = await pool.query(
    `SELECT r.*, s.subject_name
     FROM resources r
     JOIN subjects s ON s.subject_id = r.subject_id
     WHERE r.teacher_id = $1
     ORDER BY r.uploaded_at DESC`,
    [teacherId]
  );
  return result.rows;
}

async function incrementDownloadCount(resourceId) {
  const result = await pool.query(
    `UPDATE resources SET download_count = download_count + 1
     WHERE resource_id = $1
     RETURNING download_count, file_url`,
    [resourceId]
  );
  return result.rows[0];
}

async function deleteResource(resourceId, teacherId) {
  const result = await pool.query(
    `DELETE FROM resources WHERE resource_id = $1 AND teacher_id = $2 RETURNING *`,
    [resourceId, teacherId]
  );
  return result.rows[0];
}

// FIXED (Phase 3): resources previously had no update path at all --
// only create/read/download/delete. Metadata only (title/description/
// classLevel/subjectId); the uploaded file itself is immutable here,
// consistent with "preserve existing upload functionality" -- re-uploading
// a new file is a new resource, not an edit of this one.
async function updateResource(resourceId, teacherId, data) {
  const { subjectId, classLevel, title, description } = data;
  const result = await pool.query(
    `UPDATE resources
     SET subject_id = $1, class_level = $2, title = $3, description = $4
     WHERE resource_id = $5 AND teacher_id = $6
     RETURNING *`,
    [subjectId, classLevel, title, description, resourceId, teacherId]
  );
  return result.rows[0];
}
async function adminDeleteResource(resourceId) {
  const result = await pool.query(
    `DELETE FROM resources WHERE resource_id = $1 RETURNING *`,
    [resourceId]
  );
  return result.rows[0];
}
// module.exports = {
//   createResource, getAllResources, getResourceById,
//   getResourcesByTeacher, incrementDownloadCount, deleteResource, updateResource,
// };
module.exports = {
  createResource, getAllResources, getResourceById,
  getResourcesByTeacher, incrementDownloadCount, deleteResource, updateResource,
  adminDeleteResource,
};