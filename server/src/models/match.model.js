const pool = require('../config/db');

// A single, reusable "is this user actually part of this match" join --
// every query below starts from matches and resolves both sides back to
// their user_id, so ownership can be checked in SQL without trusting any
// client-supplied id beyond the match_id itself.
const MATCH_WITH_PARTICIPANTS_SQL = `
  SELECT
      m.match_id, m.status, m.started_at, m.ended_at,
      m.teacher_post_id, m.student_request_id,
      tu.user_id AS teacher_user_id, tu.full_name AS teacher_name,
      su.user_id AS student_user_id, su.full_name AS student_name,
      COALESCE(tp.subject_id, sr.subject_id) AS subject_id,
      sub.subject_name,
      COALESCE(tp.location, sr.location) AS location,
      COALESCE(tp.mode, sr.mode) AS mode,
      COALESCE(tp.expected_salary, sr.salary) AS rate
  FROM matches m
  JOIN teachers t ON t.teacher_id = m.teacher_id
  JOIN users tu   ON tu.user_id = t.user_id
  JOIN students s ON s.student_id = m.student_id
  JOIN users su   ON su.user_id = s.user_id
  LEFT JOIN teacher_tuition_posts tp ON tp.post_id = m.teacher_post_id
  LEFT JOIN student_tuition_requests sr ON sr.request_id = m.student_request_id
  LEFT JOIN subjects sub ON sub.subject_id = COALESCE(tp.subject_id, sr.subject_id)
`;

async function getMyMatches(userId) {
  const result = await pool.query(
    `${MATCH_WITH_PARTICIPANTS_SQL}
     WHERE tu.user_id = $1 OR su.user_id = $1
     ORDER BY m.started_at DESC`,
    [userId]
  );
  return result.rows;
}

// Returns the match only if userId is a genuine participant -- every
// caller (detail view, cancel, report) relies on a null result here to
// mean "not yours", so this is the one place that check is made.
async function getMatchForParticipant(matchId, userId) {
  const result = await pool.query(
    `${MATCH_WITH_PARTICIPANTS_SQL}
     WHERE m.match_id = $1 AND (tu.user_id = $2 OR su.user_id = $2)`,
    [matchId, userId]
  );
  return result.rows[0];
}

async function cancelMatch(matchId, userId, reason) {
  const result = await pool.query(
    `UPDATE matches m
     SET status = 'cancelled', ended_at = NOW()
     FROM teachers t, users tu, students s, users su
     WHERE m.match_id = $1
       AND t.teacher_id = m.teacher_id AND tu.user_id = t.user_id
       AND s.student_id = m.student_id AND su.user_id = s.user_id
       AND (tu.user_id = $2 OR su.user_id = $2)
       AND m.status = 'active'
     RETURNING m.match_id, tu.user_id AS teacher_user_id, su.user_id AS student_user_id`,
    [matchId, userId]
  );
  if (!result.rows[0]) return null;

  const { teacher_user_id, student_user_id } = result.rows[0];
  const otherUserId = userId === teacher_user_id ? student_user_id : teacher_user_id;

  await pool.query(
    `INSERT INTO notifications (user_id, type, message, link)
     VALUES ($1, 'match_cancelled', $2, '/matches')`,
    [otherUserId, `A match was cancelled. Reason: ${reason || 'No reason given.'}`]
  );

  return result.rows[0];
}

module.exports = { getMyMatches, getMatchForParticipant, cancelMatch };