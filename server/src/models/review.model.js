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

// FIXED (Phase 3, flagged in the Phase 1 audit): reviews previously had no
// update/delete at all. Only rating/comment can change -- match_id and
// reviewee_user_id are fixed at creation and never editable, so a review
// can't be silently redirected at a different teacher. Ownership is
// enforced by reviewer_user_id in the WHERE clause, never trusted from
// the request body. The existing after_review_change trigger (see
// database/functions.sql) automatically recalculates the teacher's
// avg_rating/total_reviews on both of these -- nothing extra to do here.
async function updateReview(reviewId, reviewerUserId, { rating, comment }) {
  const result = await pool.query(
    `UPDATE reviews
     SET rating = COALESCE($1, rating), comment = COALESCE($2, comment)
     WHERE review_id = $3 AND reviewer_user_id = $4
     RETURNING *`,
    [rating ?? null, comment ?? null, reviewId, reviewerUserId]
  );
  return result.rows[0];
}

async function deleteReview(reviewId, reviewerUserId) {
  const result = await pool.query(
    `DELETE FROM reviews WHERE review_id = $1 AND reviewer_user_id = $2 RETURNING *`,
    [reviewId, reviewerUserId]
  );
  return result.rows[0];
}
async function adminDeleteReview(reviewId) {
  const result = await pool.query(
    `DELETE FROM reviews WHERE review_id = $1 RETURNING *`,
    [reviewId]
  );
  return result.rows[0];
}
//module.exports = { createReview, getReviewsForTeacher, findMatch, updateReview, deleteReview };
module.exports = { createReview, getReviewsForTeacher, findMatch, updateReview, deleteReview, adminDeleteReview };