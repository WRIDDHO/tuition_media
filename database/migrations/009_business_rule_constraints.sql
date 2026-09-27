-- Migration 009: business-rule CHECK constraints that were missing from
-- the original schema -- positive rates/salaries, sane phone format,
-- and a few sanity bounds (vacancy, days_per_week) that the app has
-- always assumed but the database never enforced.
--
-- IMPORTANT: run the "check existing data" queries at the bottom of
-- this file's companion comment FIRST if this database already has
-- real rows -- ALTER TABLE ... ADD CONSTRAINT validates every existing
-- row and will fail (not silently skip) if any row violates the new
-- rule. Clean up or NULL out offending values before running this.

BEGIN;

-- ============================================================
-- teachers
-- ============================================================

ALTER TABLE teachers
  ADD CONSTRAINT chk_teachers_hourly_rate_positive
  CHECK (hourly_rate IS NULL OR hourly_rate > 0);

ALTER TABLE teachers
  ADD CONSTRAINT chk_teachers_experience_non_negative
  CHECK (experience_years >= 0);

ALTER TABLE teachers
  ADD CONSTRAINT chk_teachers_phone_format
  CHECK (phone IS NULL OR phone ~ '^[0-9]{11}$');

ALTER TABLE teachers
  ADD CONSTRAINT chk_teachers_gender_valid
  CHECK (gender IS NULL OR gender IN ('male', 'female'));

-- ============================================================
-- students
-- ============================================================

ALTER TABLE students
  ADD CONSTRAINT chk_students_phone_format
  CHECK (phone IS NULL OR phone ~ '^[0-9]{11}$');

-- ============================================================
-- teacher_tuition_posts
-- ============================================================

ALTER TABLE teacher_tuition_posts
  ADD CONSTRAINT chk_teacher_posts_salary_min
  CHECK (expected_salary IS NULL OR expected_salary > 1000);

ALTER TABLE teacher_tuition_posts
  ADD CONSTRAINT chk_teacher_posts_vacancy_positive
  CHECK (vacancy IS NULL OR vacancy > 0);

ALTER TABLE teacher_tuition_posts
  ADD CONSTRAINT chk_teacher_posts_days_per_week_range
  CHECK (days_per_week IS NULL OR days_per_week BETWEEN 1 AND 7);

-- ============================================================
-- student_tuition_requests
-- ============================================================

ALTER TABLE student_tuition_requests
  ADD CONSTRAINT chk_student_requests_salary_min
  CHECK (salary IS NULL OR salary > 1000);

ALTER TABLE student_tuition_requests
  ADD CONSTRAINT chk_student_requests_days_per_week_range
  CHECK (days_per_week IS NULL OR days_per_week BETWEEN 1 AND 7);

-- ============================================================
-- resources
-- ============================================================

ALTER TABLE resources
  ADD CONSTRAINT chk_resources_download_count_non_negative
  CHECK (download_count >= 0);

COMMIT;