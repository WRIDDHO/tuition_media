const {
  createQuestion, getAllQuestions, getQuestionWithAnswers,
  findQuestionOwner, updateQuestion, deleteQuestion, adminDeleteQuestion,
} = require('../models/question.model');
const { buildFileUrl } = require('../middleware/upload.middleware');
const { cleanBody } = require('../utils/sanitize');
const { isValidId } = require('../utils/validate');
const { sendDbError } = require('../utils/dbErrors');
const { logAdminAction } = require('../utils/auditLog');

async function create(req, res) {
  try {
    const { subjectId, title, body } = req.body;

    if (!subjectId || !title) {
      return res.status(400).json({ error: 'subjectId and title are required.' });
    }
    if (!body && !req.file) {
      return res.status(400).json({ error: 'Either body text or an image is required.' });
    }

    const imageUrl = req.file ? buildFileUrl(req.file.filename) : null;
    const question = await createQuestion(req.user.userId, { subjectId, title, body, imageUrl });

    res.status(201).json({ message: 'Question posted', question });
  } catch (err) {
    console.error('CreateQuestion error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listAll(req, res) {
  try {
    const { subjectId } = req.query;
    const questions = await getAllQuestions(subjectId);
    res.status(200).json({ count: questions.length, questions });
  } catch (err) {
    console.error('ListQuestions error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getOne(req, res) {
  try {
    const question = await getQuestionWithAnswers(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    res.status(200).json({ question });
  } catch (err) {
    console.error('GetQuestion error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function update(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question id.' });
    }

    const body = cleanBody(req.body, ['subjectId']);
    const { subjectId, title, body: text } = body;

    if (!subjectId || !title) {
      return res.status(400).json({ error: 'subjectId and title are required.' });
    }
    if (!text && !req.file) {
      return res.status(400).json({ error: 'Either body text or an image is required.' });
    }

    const imageUrl = req.file ? buildFileUrl(req.file.filename) : (req.body.imageUrl || null);
    const updated = await updateQuestion(req.params.id, req.user.userId, {
      subjectId, title, body: text, imageUrl,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Question not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Question updated', question: updated });
  } catch (err) {
    sendDbError(res, err, 'UpdateQuestion');
  }
}

async function remove(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question id.' });
    }

    // Only the asker can edit/delete their own question; an admin can
    // moderate/delete any question (never another regular user).
    let deleted;
    if (req.user.role === 'admin') {
      deleted = await adminDeleteQuestion(req.params.id);
      if (deleted) {
        await logAdminAction(req.user.userId, 'question_removed', 'question', Number(req.params.id), { title: deleted.title });
      }
    } else {
      const question = await findQuestionOwner(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found.' });
      }
      if (question.user_id !== req.user.userId) {
        return res.status(403).json({ error: 'You can only delete your own question.' });
      }
      deleted = await deleteQuestion(req.params.id, req.user.userId);
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Question not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Question deleted' });
  } catch (err) {
    sendDbError(res, err, 'DeleteQuestion');
  }
}

module.exports = { create, listAll, getOne, update, remove };