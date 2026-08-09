const {
  createTeacherPost,
  getAllTeacherPosts,
  getTeacherPostById,
  getPostsByTeacher,
  updateTeacherPost,
  deleteTeacherPost,
} = require('../models/teacherPost.model');

async function create(req, res) {
  try {
    const newPost = await createTeacherPost(req.teacherId, req.body);
    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    console.error('CreatePost error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listAll(req, res) {
  try {
    const posts = await getAllTeacherPosts();
    res.status(200).json({ count: posts.length, posts });
  } catch (err) {
    console.error('ListAll error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getOne(req, res) {
  try {
    const post = await getTeacherPostById(req.params.id);
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
    const posts = await getPostsByTeacher(req.teacherId);
    res.status(200).json({ posts });
  } catch (err) {
    console.error('ListMine error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function update(req, res) {
  try {
    const updated = await updateTeacherPost(req.params.id, req.teacherId, req.body);
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
    const deleted = await deleteTeacherPost(req.params.id, req.teacherId);
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