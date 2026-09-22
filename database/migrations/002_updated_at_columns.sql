-- Migration 002: updated_at tracking
--
-- Adds an updated_at column to every table whose rows are realistically
-- edited after creation (profiles, posts/requests, application/match
-- status, resources, questions/answers), backed by one shared trigger
-- function. Existing rows are backfilled from their original creation
-- timestamp so updated_at is never left NULL.
--
-- Deliberately left out: subjects, teacher_subjects, resource_bookmarks,
-- notifications, reviews. These are either static reference data, pure
-- join tables, or rows that are conceptually append-only/immutable once
-- created -- an updated_at column on them would just sit unused.

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
DROP TRIGGER IF EXISTS trg_teachers_updated_at ON teachers;
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- students
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- teacher_tuition_posts
ALTER TABLE teacher_tuition_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE teacher_tuition_posts SET updated_at = posted_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_teacher_posts_updated_at ON teacher_tuition_posts;
CREATE TRIGGER trg_teacher_posts_updated_at BEFORE UPDATE ON teacher_tuition_posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- student_tuition_requests
ALTER TABLE student_tuition_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE student_tuition_requests SET updated_at = posted_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_student_requests_updated_at ON student_tuition_requests;
CREATE TRIGGER trg_student_requests_updated_at BEFORE UPDATE ON student_tuition_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- teacher_post_applications
ALTER TABLE teacher_post_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE teacher_post_applications SET updated_at = applied_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_post_apps_updated_at ON teacher_post_applications;
CREATE TRIGGER trg_post_apps_updated_at BEFORE UPDATE ON teacher_post_applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- student_request_applications
ALTER TABLE student_request_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE student_request_applications SET updated_at = applied_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_request_apps_updated_at ON student_request_applications;
CREATE TRIGGER trg_request_apps_updated_at BEFORE UPDATE ON student_request_applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE matches SET updated_at = started_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_matches_updated_at ON matches;
CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE resources SET updated_at = uploaded_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_resources_updated_at ON resources;
CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE questions SET updated_at = posted_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_questions_updated_at ON questions;
CREATE TRIGGER trg_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- answers
ALTER TABLE answers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE answers SET updated_at = posted_at WHERE updated_at IS NULL;
DROP TRIGGER IF EXISTS trg_answers_updated_at ON answers;
CREATE TRIGGER trg_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
