const {
  createAnswer, findAnswerOwner, findQuestionOwner, acceptAnswer,
  updateAnswer, deleteAnswer, adminDeleteAnswer,
} = require('../models/answer.model');
const { buildFileUrl } = require('../middleware/upload.middleware');
const { isValidId } = require('../utils/validate');
const { sendDbError } = require('../utils/dbErrors');
const { logAdminAction } = require('../utils/auditLog');

async function create(req, res) {
  try {
    const { questionId } = req.params;
    const { body } = req.body;

    if (!body && !req.file) {
      return res.status(400).json({ error: 'Either body text or an image is required.' });
    }

    const imageUrl = req.file ? buildFileUrl(req.file.filename) : null;
    const answer = await createAnswer(req.user.userId, questionId, { body, imageUrl });

    res.status(201).json({ message: 'Answer posted', answer });
  } catch (err) {
    sendDbError(res, err, 'CreateAnswer');
  }
}

async function accept(req, res) {
  try {
    const { answerId } = req.params;

    const answer = await findAnswerOwner(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found.' });
    }

    const question = await findQuestionOwner(answer.question_id);
    if (question.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the person who asked can accept an answer.' });
    }

    const updated = await acceptAnswer(answerId, answer.question_id);
    res.status(200).json({ message: 'Answer marked as accepted', answer: updated });
  } catch (err) {
    sendDbError(res, err, 'AcceptAnswer');
  }
}

// FIXED (Phase 3, flagged in the Phase 1 audit): only the answer's own
// author may edit it.
async function update(req, res) {
  try {
    if (!isValidId(req.params.answerId)) {
      return res.status(400).json({ error: 'Invalid answer id.' });
    }

    const { body } = req.body;
    if (!body && !req.file) {
      return res.status(400).json({ error: 'Either body text or an image is required.' });
    }

    const imageUrl = req.file ? buildFileUrl(req.file.filename) : (req.body.imageUrl || null);
    const updated = await updateAnswer(req.params.answerId, req.user.userId, { body, imageUrl });
    if (!updated) {
      return res.status(404).json({ error: 'Answer not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Answer updated', answer: updated });
  } catch (err) {
    sendDbError(res, err, 'UpdateAnswer');
  }
}

async function remove(req, res) {
  try {
    if (!isValidId(req.params.answerId)) {
      return res.status(400).json({ error: 'Invalid answer id.' });
    }

    // Only the answer's own author can delete it; an admin can moderate
    // any answer (another teacher never can, regardless of role).
    let deleted;
    if (req.user.role === 'admin') {
      deleted = await adminDeleteAnswer(req.params.answerId);
      if (deleted) {
        await logAdminAction(req.user.userId, 'answer_removed', 'answer', Number(req.params.answerId), null);
      }
    } else {
      const answer = await findAnswerOwner(req.params.answerId);
      if (!answer) {
        return res.status(404).json({ error: 'Answer not found.' });
      }
      if (answer.user_id !== req.user.userId) {
        return res.status(403).json({ error: 'You can only delete your own answer.' });
      }
      deleted = await deleteAnswer(req.params.answerId, req.user.userId);
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Answer not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Answer deleted' });
  } catch (err) {
    sendDbError(res, err, 'DeleteAnswer');
  }
}

module.exports = { create, accept, update, remove };
