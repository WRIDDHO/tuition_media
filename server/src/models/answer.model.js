const pool = require('../config/db');

async function createAnswer(userId, questionId, data) {
  const { body, imageUrl } = data;
  const result = await pool.query(
    `INSERT INTO answers (question_id, user_id, body, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [questionId, userId, body, imageUrl]
  );
  return result.rows[0];
}

async function findAnswerOwner(answerId) {
  const result = await pool.query(
    `SELECT user_id, question_id FROM answers WHERE answer_id = $1`,
    [answerId]
  );
  return result.rows[0];
}

async function findQuestionOwner(questionId) {
  const result = await pool.query(
    `SELECT user_id FROM questions WHERE question_id = $1`,
    [questionId]
  );
  return result.rows[0];
}

async function acceptAnswer(answerId, questionId) {
  // unmark any previously accepted answer for this question, then mark the new one
  await pool.query(
    `UPDATE answers SET is_accepted = FALSE WHERE question_id = $1`,
    [questionId]
  );
  const result = await pool.query(
    `UPDATE answers SET is_accepted = TRUE WHERE answer_id = $1 RETURNING *`,
    [answerId]
  );
  return result.rows[0];
}

module.exports = { createAnswer, findAnswerOwner, findQuestionOwner, acceptAnswer };