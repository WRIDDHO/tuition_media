const {
  createStudentRequest,
  getAllStudentRequests,
  getStudentRequestById,
  getRequestsByStudent,
  updateStudentRequest,
  deleteStudentRequest,
  adminDeleteStudentRequest,
} = require('../models/studentRequest.model');

const { cleanBody } = require('../utils/sanitize');
const { isValidId } = require('../utils/validate');
const { sendDbError } = require('../utils/dbErrors');
const { logAdminAction } = require('../utils/auditLog');

// Fields that must become NULL when the form sends an empty string --
// salary/daysPerWeek are NUMERIC/INTEGER columns that reject ''.
// FIXED (Phase 3): this controller previously did no cleaning at all,
// unlike teacherPost.controller.js's identical need for the same reason.
const NULLABLE_FIELDS = [
  'salary', 'daysPerWeek', 'classLevel', 'description',
  'preferredInstitution', 'location', 'preferredTime',
];

async function create(req, res) {
  try {
    const body = cleanBody(req.body, NULLABLE_FIELDS);

    if (!body.subjectId) {
      return res.status(400).json({ error: 'subjectId is required.' });
    }

    const newPost = await createStudentRequest(req.studentId, body);
    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    sendDbError(res, err, 'CreatePost');
  }
}

async function listAll(req, res) {
  try {
    const posts = await getAllStudentRequests();
    res.status(200).json({ count: posts.length, posts });
  } catch (err) {
    sendDbError(res, err, 'ListAll');
  }
}

async function getOne(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid request id.' });
    }

    const post = await getStudentRequestById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.status(200).json({ post });
  } catch (err) {
    sendDbError(res, err, 'GetOne');
  }
}

async function listMine(req, res) {
  try {
    const posts = await getRequestsByStudent(req.studentId);
    res.status(200).json({ posts });
  } catch (err) {
    sendDbError(res, err, 'ListMine');
  }
}

async function update(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid request id.' });
    }

    // Absent keys stay absent, so a partial update never wipes a field.
    const body = cleanBody(req.body, NULLABLE_FIELDS);

    const updated = await updateStudentRequest(req.params.id, req.studentId, body);
    if (!updated) {
      return res.status(404).json({ error: 'Post not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Post updated', post: updated });
  } catch (err) {
    sendDbError(res, err, 'UpdatePost');
  }
}

async function remove(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid request id.' });
    }

    // Admins moderate any request; owners can only delete their own
    // (enforced in SQL via student_id, never trusted from the request).
    let deleted;
    if (req.user.role === 'admin') {
      deleted = await adminDeleteStudentRequest(req.params.id);
      if (deleted) {
        await logAdminAction(req.user.userId, 'request_removed', 'student_request', Number(req.params.id), null);
      }
    } else {
      deleted = await deleteStudentRequest(req.params.id, req.studentId);
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Post not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    sendDbError(res, err, 'DeletePost');
  }
}

module.exports = { create, listAll, getOne, listMine, update, remove };
