-- Migration 006: Missing indexes based on the queries the models
-- actually run today (see server/src/models/*.js). Every index below is
-- tied to a named query below it -- none are speculative.

BEGIN;

-- application.model.js getApplicationsForPost(): WHERE a.post_id = $1
-- application.model.js getMyPostApplications(): WHERE a.student_id = $1
CREATE INDEX IF NOT EXISTS idx_post_apps_post_id ON teacher_post_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_post_apps_student_id ON teacher_post_applications(student_id);

-- application.model.js getApplicationsForRequest(): WHERE a.request_id = $1
-- application.model.js getMyRequestApplications(): WHERE a.teacher_id = $1
CREATE INDEX IF NOT EXISTS idx_request_apps_request_id ON student_request_applications(request_id);
CREATE INDEX IF NOT EXISTS idx_request_apps_teacher_id ON student_request_applications(teacher_id);

-- application.model.js getMyPostApplications():
--   LEFT JOIN matches m ON m.teacher_post_id = a.post_id AND m.student_id = a.student_id
-- and the mirror-image lookup on the request side once that endpoint ships.
CREATE INDEX IF NOT EXISTS idx_matches_post_student ON matches(teacher_post_id, student_id);
CREATE INDEX IF NOT EXISTS idx_matches_request_teacher ON matches(student_request_id, teacher_id);
-- general FK lookups: "my matches" dashboards, RESTRICT check on delete
CREATE INDEX IF NOT EXISTS idx_matches_teacher_id ON matches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_matches_student_id ON matches(student_id);

-- review.model.js getReviewsForTeacher() AND functions.sql's
-- recompute_teacher_rating() both filter on reviewee_user_id -- the first
-- on every teacher-profile page view, the second on every review write.
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_user_id);

-- question.model.js getAllQuestions(): WHERE q.subject_id = $1 (optional filter)
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
-- supports ownership checks / an upcoming "my questions" list
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);

-- question.model.js getQuestionWithAnswers(): correlated subquery/join on question_id,
-- run on every question-detail page view
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
-- ownership checks / an upcoming "my answers" list
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);

-- upcoming admin dashboard's core query: "pending teachers" is
-- WHERE role = 'teacher' AND account_status = 'pending' (see
-- pending_teacher_verifications view in views.sql)
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, account_status);

-- active/expired-post queries filter on status, often together with deadline
CREATE INDEX IF NOT EXISTS idx_teacher_posts_status_deadline ON teacher_tuition_posts(status, deadline);
CREATE INDEX IF NOT EXISTS idx_student_requests_status ON student_tuition_requests(status);

COMMIT;
