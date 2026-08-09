const { createQuestion, getAllQuestions, getQuestionWithAnswers } = require('../models/question.model');
const { buildFileUrl } = require('../middleware/upload.middleware');

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

module.exports = { create, listAll, getOne };