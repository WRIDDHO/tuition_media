const { createAnswer, findAnswerOwner, findQuestionOwner, acceptAnswer } = require('../models/answer.model');
const { buildFileUrl } = require('../middleware/upload.middleware');

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
    console.error('CreateAnswer error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
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
    console.error('AcceptAnswer error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { create, accept };