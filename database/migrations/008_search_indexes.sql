-- Migration 008: indexes for the new teacher-post and student-request
-- search filters (Phase 1 of the search/filter API work). Follows the
-- same "one index per named query" discipline as migration 006 --
-- migration 006 already covers (status, deadline) on teacher_tuition_posts
-- and (status) on student_tuition_requests, so those are not repeated here.

BEGIN;

-- teacher_tuition_posts search filters: subjectId, location, mode,
-- classLevel, minSalary/maxSalary, daysPerWeek, preferredGender
CREATE INDEX IF NOT EXISTS idx_teacher_posts_subject_id ON teacher_tuition_posts(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_location ON teacher_tuition_posts(location);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_mode ON teacher_tuition_posts(mode);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_class_level ON teacher_tuition_posts(class_level);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_expected_salary ON teacher_tuition_posts(expected_salary);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_days_per_week ON teacher_tuition_posts(days_per_week);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_preferred_gender ON teacher_tuition_posts(preferred_gender);

-- student_tuition_requests search filters: subjectId, location, mode,
-- categoryName, classLevel, minSalary/maxSalary, daysPerWeek,
-- preferredInstitution
CREATE INDEX IF NOT EXISTS idx_student_requests_subject_id ON student_tuition_requests(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_location ON student_tuition_requests(location);
CREATE INDEX IF NOT EXISTS idx_student_requests_mode ON student_tuition_requests(mode);
CREATE INDEX IF NOT EXISTS idx_student_requests_category_name ON student_tuition_requests(category_name);
CREATE INDEX IF NOT EXISTS idx_student_requests_class_level ON student_tuition_requests(class_level);
CREATE INDEX IF NOT EXISTS idx_student_requests_salary ON student_tuition_requests(salary);
CREATE INDEX IF NOT EXISTS idx_student_requests_days_per_week ON student_tuition_requests(days_per_week);
CREATE INDEX IF NOT EXISTS idx_student_requests_preferred_institution ON student_tuition_requests(preferred_institution);

COMMIT;