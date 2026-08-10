const pool = require('../config/db');

async function createReview(reviewerUserId, data) {
  const { matchId, revieweeUserId, rating, comment } = data;

  const result = await pool.query(
    `INSERT INTO reviews (match_id, reviewer_user_id, reviewee_user_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [matchId, reviewerUserId, revieweeUserId, rating, comment]
  );
  return result.rows[0];
}

async function getReviewsForTeacher(teacherUserId) {
  const result = await pool.query(
    `SELECT r.*, u.full_name AS reviewer_name
     FROM reviews r
     JOIN users u ON u.user_id = r.reviewer_user_id
     WHERE r.reviewee_user_id = $1
     ORDER BY r.created_at DESC`,
    [teacherUserId]
  );
  return result.rows;
}

async function findMatch(matchId) {
  const result = await pool.query(
    `SELECT * FROM matches WHERE match_id = $1`,
    [matchId]
  );
  return result.rows[0];
}

module.exports = { createReview, getReviewsForTeacher, findMatch };