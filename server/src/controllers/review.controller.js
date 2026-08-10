const { createReview, getReviewsForTeacher, findMatch } = require('../models/review.model');
const { findTeacherById } = require('../models/teacher.model');

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
    console.error('CreateReview error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
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
    console.error('ListReviews error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { create, listForTeacher };