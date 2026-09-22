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

// FIXED (Phase 3): wrapped in an explicit transaction, and now also marks
// the question 'solved' -- questions.status already existed in the schema
// for exactly this but was never set anywhere (a dormant column). If
// either statement fails, both roll back together.
async function acceptAnswer(answerId, questionId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // unmark any previously accepted answer for this question, then mark the new one
    await client.query(`UPDATE answers SET is_accepted = FALSE WHERE question_id = $1`, [questionId]);
    const result = await client.query(
      `UPDATE answers SET is_accepted = TRUE WHERE answer_id = $1 RETURNING *`,
      [answerId]
    );
    await client.query(`UPDATE questions SET status = 'solved' WHERE question_id = $1`, [questionId]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// FIXED (Phase 3, flagged in the Phase 1 audit): answers previously had no
// update/delete at all. Only the answer's author may edit it.
async function updateAnswer(answerId, userId, data) {
  const { body, imageUrl } = data;
  const result = await pool.query(
    `UPDATE answers
     SET body = $1, image_url = $2
     WHERE answer_id = $3 AND user_id = $4
     RETURNING *`,
    [body, imageUrl, answerId, userId]
  );
  return result.rows[0];
}

async function deleteAnswer(answerId, userId) {
  const result = await pool.query(
    `DELETE FROM answers WHERE answer_id = $1 AND user_id = $2 RETURNING *`,
    [answerId, userId]
  );
  return result.rows[0];
}

// Admin moderation: delete regardless of author.
async function adminDeleteAnswer(answerId) {
  const result = await pool.query(
    `DELETE FROM answers WHERE answer_id = $1 RETURNING *`,
    [answerId]
  );
  return result.rows[0];
}

module.exports = {
  createAnswer, findAnswerOwner, findQuestionOwner, acceptAnswer,
  updateAnswer, deleteAnswer, adminDeleteAnswer,
};
