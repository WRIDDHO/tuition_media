-- database/views.sql
--
-- Views only exist here because each one collapses a query pattern that
-- already appears in more than one place today, or that the upcoming
-- admin dashboard needs verbatim. This phase only defines them; wiring
-- the existing controllers to use them instead of their own hand-written
-- joins is a follow-up refactor for the next phase, not done here.
--
-- Run order: schema.sql -> database/migrations/*.sql -> functions.sql -> this file

-- ============================================================
-- VIEW: teacher_directory
-- Reused by: teacher.controller.js (getMyProfile / getTeacherPublic),
-- review.controller.js (listForTeacher). Both currently hand-write their
-- own `teachers JOIN users` query; this is that same shape, defined once.
-- ============================================================
CREATE OR REPLACE VIEW teacher_directory AS
SELECT
    t.teacher_id,
    t.user_id,
    u.full_name,
    u.email,
    u.account_status,
    u.profile_picture,
    t.qualification,
    t.institution,
    t.current_level,
    t.major,
    t.experience_years,
    t.gender,
    t.hourly_rate,
    t.district,
    t.area,
    t.phone,
    t.avg_rating,
    t.total_reviews
FROM teachers t
JOIN users u ON u.user_id = t.user_id;

-- ============================================================
-- VIEW: pending_teacher_verifications
-- Backs the admin "review pending teachers" screen directly -- the
-- entire query behind that page is `SELECT * FROM this view`.
-- ============================================================
CREATE OR REPLACE VIEW pending_teacher_verifications AS
SELECT
    t.teacher_id,
    u.user_id,
    u.full_name,
    u.email,
    t.qualification,
    t.institution,
    t.experience_years,
    u.created_at AS applied_at
FROM users u
LEFT JOIN teachers t ON t.user_id = u.user_id
WHERE u.role = 'teacher' AND u.account_status = 'pending'
ORDER BY u.created_at ASC;

-- ============================================================
-- VIEW: teacher_rating_leaderboard
-- Ranks only teachers who have at least one review -- an unrated teacher
-- isn't "worse", they're simply not comparable yet, so they're excluded
-- rather than ranked last with a fake 0 rating.
-- ============================================================
CREATE OR REPLACE VIEW teacher_rating_leaderboard AS
SELECT
    t.teacher_id,
    u.full_name,
    t.district,
    t.avg_rating,
    t.total_reviews,
    RANK() OVER (ORDER BY t.avg_rating DESC, t.total_reviews DESC) AS rating_rank
FROM teachers t
JOIN users u ON u.user_id = t.user_id
WHERE t.total_reviews > 0;

-- ============================================================
-- VIEW: recent_platform_activity
-- Feeds the admin dashboard's "Recent activity" widget: the newest items
-- across four unrelated tables, merged into one timeline via UNION ALL.
-- (UNION ALL, not UNION, because these rows can never be true duplicates
-- of each other and there's no reason to pay for the extra de-dup pass.)
--
-- Intentionally has no ORDER BY/LIMIT of its own -- a view's own ORDER BY
-- isn't guaranteed to survive once something else queries it. Consume it
-- like:
--   SELECT * FROM recent_platform_activity ORDER BY occurred_at DESC LIMIT 20;
-- ============================================================
CREATE OR REPLACE VIEW recent_platform_activity AS
SELECT 'teacher_post' AS activity_type, tp.title AS summary, tp.posted_at AS occurred_at
FROM teacher_tuition_posts tp
UNION ALL
SELECT 'student_request' AS activity_type, 'Request for ' || s.subject_name AS summary, sr.posted_at AS occurred_at
FROM student_tuition_requests sr
JOIN subjects s ON s.subject_id = sr.subject_id
UNION ALL
SELECT 'question' AS activity_type, q.title AS summary, q.posted_at AS occurred_at
FROM questions q
UNION ALL
SELECT 'application' AS activity_type, 'New application on post #' || a.post_id AS summary, a.applied_at AS occurred_at
FROM teacher_post_applications a;
