//fully written by me seeing teacherPost.controller.js
const {
  createStudentRequest,
  getAllStudentRequests,
  getStudentRequestById,
  getRequestsByStudent,
  updateStudentRequest,
  deleteStudentRequest,
} = require('../models/studentRequest.model');

async function create(req, res) {
  try {
    const newPost = await createStudentRequest(req.studentId, req.body);
    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    console.error('CreatePost error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listAll(req, res) {
  try {
    const posts = await  getAllStudentRequests();
    res.status(200).json({ count: posts.length, posts });
  } catch (err) {
    console.error('ListAll error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getOne(req, res) {
  try {
    const post = await getStudentRequestById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.status(200).json({ post });
  } catch (err) {
    console.error('GetOne error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listMine(req, res) {
  try {
    const posts = await getRequestsByStudent(req.studentId);
    res.status(200).json({ posts });
  } catch (err) {
    console.error('ListMine error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function update(req, res) {
  try {
    const updated = await updateStudentRequest(req.params.id, req.studentId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Post not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Post updated', post: updated });
  } catch (err) {
    console.error('UpdatePost error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function remove(req, res) {
  try {
    const deleted = await  deleteStudentRequest(req.params.id, req.studentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    console.error('DeletePost error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { create, listAll, getOne, listMine, update, remove };