-- Migration 003: Foreign key / ON DELETE review
--
-- Goals:
-- 1) Preserve community content (Q&A) and rating/review history when a
--    user account is later deleted, instead of silently CASCADE-wiping it.
-- 2) Make the previously-implicit ON DELETE behavior on `matches` explicit
--    and consistent: a teacher, student, post, or request that has ever
--    produced a match cannot be hard-deleted while that match exists, so
--    ratings/reviews can never be left pointing at nothing.
--
-- Nothing here changes existing data; these are all forward-looking
-- deletion-behavior changes plus one column nullability relaxation
-- (dropping NOT NULL never breaks existing populated rows).
--
-- Constraint names below are Postgres's default auto-generated names for
-- the unnamed constraints in schema.sql (<table>_<column>_fkey). If a
-- DROP CONSTRAINT below reports "does not exist", run \d <table> in psql
-- to find the actual name on your database and adjust it here.

BEGIN;

-- ---- questions.user_id: keep the question, drop the link to a deleted account ----
ALTER TABLE questions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_user_id_fkey;
ALTER TABLE questions
  ADD CONSTRAINT questions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- ---- answers.user_id: same reasoning -- an answer stays useful to future readers ----
ALTER TABLE answers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_user_id_fkey;
ALTER TABLE answers
  ADD CONSTRAINT answers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- ---- reviews: a rating/comment should outlive either party's account ----
-- (both columns were already nullable; only the ON DELETE action is added)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_user_id_fkey;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_reviewer_user_id_fkey
  FOREIGN KEY (reviewer_user_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_user_id_fkey;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_reviewee_user_id_fkey
  FOREIGN KEY (reviewee_user_id) REFERENCES users(user_id) ON DELETE SET NULL;
-- NOTE: functions.sql's update_teacher_rating() trigger is updated in this
-- same phase to correctly recompute a teacher's rating when their
-- reviewee_user_id is cleared this way -- see functions.sql.

-- ---- matches: make the previously-implicit ON DELETE behavior explicit ----
-- A teacher/student with match history cannot be hard-deleted (RESTRICT).
-- This protects rating/review integrity; admins should suspend, not
-- delete, a user who has match history. This matches the behavior the
-- tables already had by default (no ON DELETE = NO ACTION), just spelled
-- out on purpose instead of by accident.
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_teacher_id_fkey;
ALTER TABLE matches
  ADD CONSTRAINT matches_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE RESTRICT;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_student_id_fkey;
ALTER TABLE matches
  ADD CONSTRAINT matches_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE RESTRICT;

-- The originating post/request is also RESTRICT, not SET NULL. Every
-- match today comes from accept_post_application(), which always sets
-- exactly one of teacher_post_id/student_request_id and leaves the other
-- NULL -- so SET NULL here would immediately leave a match with BOTH
-- columns NULL, which migration 004's matches_origin_check then rejects.
-- RESTRICT avoids that contradiction outright: a post/request that has
-- produced a match cannot be deleted until the match itself is handled,
-- which also matches "preserve historical records" from the project spec.
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_teacher_post_id_fkey;
ALTER TABLE matches
  ADD CONSTRAINT matches_teacher_post_id_fkey
  FOREIGN KEY (teacher_post_id) REFERENCES teacher_tuition_posts(post_id) ON DELETE RESTRICT;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_student_request_id_fkey;
ALTER TABLE matches
  ADD CONSTRAINT matches_student_request_id_fkey
  FOREIGN KEY (student_request_id) REFERENCES student_tuition_requests(request_id) ON DELETE RESTRICT;

COMMIT;
