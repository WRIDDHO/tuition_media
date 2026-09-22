const { createReview, getReviewsForTeacher, findMatch, updateReview, deleteReview, adminDeleteReview } = require('../models/review.model');
const { findTeacherById } = require('../models/teacher.model');
const { isValidId } = require('../utils/validate');
const { sendDbError } = require('../utils/dbErrors');
const { logAdminAction } = require('../utils/auditLog');
async function create(req, res) {
  try {
    const { matchId, rating, comment } = req.body;

    if (!matchId || !rating) {
      return res.status(400).json({ error: 'matchId and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5.' });
    }

    const match = await findMatch(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    // find the teacher's user_id from the match, since reviews reference users, not teacher_id
    const teacher = await findTeacherById(match.teacher_id);
    if (match.student_id !== req.studentId) {
      return res.status(403).json({ error: 'You can only review your own matches.' });
    }

    const review = await createReview(req.user.userId, {
      matchId,
      revieweeUserId: teacher.user_id,
      rating,
      comment,
    });

    res.status(201).json({ message: 'Review submitted', review });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already reviewed this match.' });
    }
    sendDbError(res, err, 'CreateReview');
  }
}

async function listForTeacher(req, res) {
  try {
    const teacher = await findTeacherById(req.params.teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }
    const reviews = await getReviewsForTeacher(teacher.user_id);
    res.status(200).json({
      avgRating: teacher.avg_rating,
      totalReviews: teacher.total_reviews,
      reviews,
    });
  } catch (err) {
    sendDbError(res, err, 'ListReviews');
  }
}

// FIXED (Phase 3, flagged in the Phase 1 audit): reviews previously had
// no update/delete -- only the reviewer themself may touch their own
// review, enforced in SQL (see review.model.js), never trusted from the
// request. The existing after_review_change trigger recalculates the
// teacher's avg_rating/total_reviews automatically either way.
async function update(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid review id.' });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'rating must be between 1 and 5.' });
    }

    // FIXED: previously an omitted field became NULL in the DB. Now the
    // model itself keeps whatever wasn't sent (see review.model.js).
    const updated = await updateReview(req.params.id, req.user.userId, { rating, comment });
    if (!updated) {
      return res.status(404).json({ error: 'Review not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Review updated', review: updated });
  } catch (err) {
    sendDbError(res, err, 'UpdateReview');
  }
}


async function remove(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid review id.' });
    }

    let deleted;
    if (req.user.role === 'admin') {
      deleted = await adminDeleteReview(req.params.id);
      if (deleted) {
        await logAdminAction(req.user.userId, 'review_removed', 'review', Number(req.params.id), null);
      }
    } else {
      deleted = await deleteReview(req.params.id, req.user.userId);
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Review not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Review deleted' });
  } catch (err) {
    sendDbError(res, err, 'DeleteReview');
  }
}

module.exports = { create, listForTeacher, update, remove };
