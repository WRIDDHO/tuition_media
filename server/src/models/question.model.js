const pool = require('../config/db');

async function createQuestion(userId, data) {
  const { subjectId, title, body, imageUrl } = data;

  const result = await pool.query(
    `INSERT INTO questions (user_id, subject_id, title, body, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, subjectId, title, body, imageUrl]
  );
  return result.rows[0];
}

async function getAllQuestions(subjectId) {
  const result = await pool.query(
    `SELECT q.*, s.subject_name, u.full_name AS asked_by,
            (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS answer_count
     FROM questions q
     JOIN subjects s ON s.subject_id = q.subject_id
     JOIN users u ON u.user_id = q.user_id
     WHERE ($1::INTEGER IS NULL OR q.subject_id = $1)
     ORDER BY q.posted_at DESC`,
    [subjectId || null]
  );
  return result.rows;
}

async function getQuestionWithAnswers(questionId) {
  const result = await pool.query(
    `SELECT q.*, s.subject_name, u.full_name AS asked_by,
       COALESCE(
         (SELECT JSON_AGG(
             JSON_BUILD_OBJECT(
               'answer_id', a.answer_id,
               'body', a.body,
               'image_url', a.image_url,
               'is_accepted', a.is_accepted,
               'posted_at', a.posted_at,
               'answered_by', au.full_name,
               'answered_by_user_id', a.user_id
             ) ORDER BY a.is_accepted DESC, a.posted_at ASC
           )
          FROM answers a
          JOIN users au ON au.user_id = a.user_id
          WHERE a.question_id = q.question_id
         ),
         '[]'::JSON
       ) AS answers
     FROM questions q
     JOIN subjects s ON s.subject_id = q.subject_id
     JOIN users u ON u.user_id = q.user_id
     WHERE q.question_id = $1`,
    [questionId]
  );
  return result.rows[0];
}

// Lightweight lookup for ownership checks -- avoids pulling every answer
// just to find out who owns the question.
async function findQuestionOwner(questionId) {
  const result = await pool.query(
    `SELECT question_id, user_id FROM questions WHERE question_id = $1`,
    [questionId]
  );
  return result.rows[0];
}

// FIXED (Phase 3, flagged in the Phase 1 audit): questions previously had
// no update/delete at all. Only the asker may edit their own question,
// and only title/body/imageUrl/subjectId change -- posted_at and the
// asker themself are never touched by an edit.
async function updateQuestion(questionId, userId, data) {
  const { subjectId, title, body, imageUrl } = data;
  const result = await pool.query(
    `UPDATE questions
     SET subject_id = $1, title = $2, body = $3, image_url = $4
     WHERE question_id = $5 AND user_id = $6
     RETURNING *`,
    [subjectId, title, body, imageUrl, questionId, userId]
  );
  return result.rows[0];
}

async function deleteQuestion(questionId, userId) {
  const result = await pool.query(
    `DELETE FROM questions WHERE question_id = $1 AND user_id = $2 RETURNING *`,
    [questionId, userId]
  );
  return result.rows[0];
}

// Admin moderation: delete regardless of author.
async function adminDeleteQuestion(questionId) {
  const result = await pool.query(
    `DELETE FROM questions WHERE question_id = $1 RETURNING *`,
    [questionId]
  );
  return result.rows[0];
}

module.exports = {
  createQuestion, getAllQuestions, getQuestionWithAnswers, findQuestionOwner,
  updateQuestion, deleteQuestion, adminDeleteQuestion,
};