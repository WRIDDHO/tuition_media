-- Migration 004: Additional CHECK constraints
--
-- Adds sanity bounds the schema didn't previously enforce. Every one of
-- these is a numeric range check that any correctly-behaving row already
-- satisfies (nothing in the current controllers can produce a negative
-- salary or a 0-day work week), so this should apply cleanly to existing
-- data. If a constraint fails to apply, it means bad data got in through
-- direct SQL/manual testing and should be inspected and corrected first --
-- do not weaken the constraint to make it pass.

BEGIN;

ALTER TABLE teachers
  ADD CONSTRAINT teachers_experience_years_check CHECK (experience_years >= 0),
  ADD CONSTRAINT teachers_hourly_rate_check CHECK (hourly_rate IS NULL OR hourly_rate >= 0);

ALTER TABLE teacher_tuition_posts
  ADD CONSTRAINT teacher_posts_vacancy_check CHECK (vacancy > 0),
  ADD CONSTRAINT teacher_posts_salary_check CHECK (expected_salary IS NULL OR expected_salary >= 0),
  ADD CONSTRAINT teacher_posts_days_check CHECK (days_per_week IS NULL OR days_per_week BETWEEN 1 AND 7);

ALTER TABLE student_tuition_requests
  ADD CONSTRAINT student_requests_salary_check CHECK (salary IS NULL OR salary >= 0),
  ADD CONSTRAINT student_requests_days_check CHECK (days_per_week IS NULL OR days_per_week BETWEEN 1 AND 7);

ALTER TABLE resources
  ADD CONSTRAINT resources_download_count_check CHECK (download_count >= 0);

-- A match must trace back to at least one originating post or request --
-- prevents an orphaned match with no context on either side. Migration 003
-- deliberately made teacher_post_id/student_request_id RESTRICT (not SET
-- NULL) specifically so this constraint can never be violated by a FK
-- cascade; it only guards against a future bug in application code (e.g.
-- a request-side "accept" procedure) inserting a match with neither set.
ALTER TABLE matches
  ADD CONSTRAINT matches_origin_check
  CHECK (teacher_post_id IS NOT NULL OR student_request_id IS NOT NULL);

COMMIT;
