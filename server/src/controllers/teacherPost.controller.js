// server/src/controllers/teacherPost.controller.js
const {
  createTeacherPost,
  getAllTeacherPosts,
  getTeacherPostById,
  getPostsByTeacher,
  updateTeacherPost,
  deleteTeacherPost,
} = require('../models/teacherPost.model');

const { cleanBody } = require('../utils/sanitize');

// Fields that must become NULL when the form sends an empty string.
// 'deadline' is a DATE column and is the one that caused error 22007.
// Verified against information_schema for teacher_tuition_posts.
const NULLABLE_FIELDS = [
  'deadline',
  'expectedSalary',
  'daysPerWeek',
  'duration',
  'classLevel',
  'location',
  'preferredTime',
  'description',
];

// Postgres error codes worth logging clearly.
function logDbError(label, err) {
  console.error(`${label}:`, {
    message: err.message,
    code: err.code,
    detail: err.detail,
    column: err.column,
  });
}

// URL params are always strings; reject anything that is not a positive integer.
function isValidId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

async function create(req, res) {
  try {
    const body = cleanBody(req.body, NULLABLE_FIELDS);

    if (!body.title || !body.subjectId) {
      return res.status(400).json({ error: 'Title and subject are required.' });
    }

    const newPost = await createTeacherPost(req.teacherId, body);
    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    logDbError('CreatePost error', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listAll(req, res) {
  try {
    const posts = await getAllTeacherPosts();
    res.status(200).json({ count: posts.length, posts });
  } catch (err) {
    logDbError('ListAll error', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getOne(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post id.' });
    }

    const post = await getTeacherPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.status(200).json({ post });
  } catch (err) {
    logDbError('GetOne error', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listMine(req, res) {
  try {
    const posts = await getPostsByTeacher(req.teacherId);
    res.status(200).json({ posts });
  } catch (err) {
    logDbError('ListMine error', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function update(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post id.' });
    }

    // Absent keys stay absent, so a partial update never wipes a field.
    const body = cleanBody(req.body, NULLABLE_FIELDS);

    const updated = await updateTeacherPost(req.params.id, req.teacherId, body);
    if (!updated) {
      return res.status(404).json({ error: 'Post not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Post updated', post: updated });
  } catch (err) {
    logDbError('UpdatePost error', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function remove(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post id.' });
    }

    const deleted = await deleteTeacherPost(req.params.id, req.teacherId);
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    logDbError('DeletePost error', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { create, listAll, getOne, listMine, update, remove };