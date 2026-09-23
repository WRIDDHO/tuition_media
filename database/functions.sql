DROP FUNCTION IF EXISTS search_teachers(TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_teachers(
    p_subject_name TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_min_rate INTEGER DEFAULT NULL,
    p_max_rate INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE(
    teacher_id INTEGER,
    full_name VARCHAR,
    qualification VARCHAR,
    institution VARCHAR,
    experience_years INTEGER,
    hourly_rate INTEGER,
    district VARCHAR,
    area VARCHAR,
    subjects JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.teacher_id,
        u.full_name,
        t.qualification,
        t.institution,
        t.experience_years,
        t.hourly_rate,
        t.district,
        t.area,
        COALESCE(
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT('subject_name', s.subject_name, 'level', ts.proficiency_level)
                )
                FROM teacher_subjects ts
                JOIN subjects s ON s.subject_id = ts.subject_id
                WHERE ts.teacher_id = t.teacher_id
            ),
            '[]'::JSON
        ) AS subjects
    FROM teachers t
    INNER JOIN users u ON u.user_id = t.user_id
    WHERE
        u.account_status = 'active'
        AND (p_subject_name IS NULL OR EXISTS (
            SELECT 1 FROM teacher_subjects ts2
            JOIN subjects s2 ON s2.subject_id = ts2.subject_id
            WHERE ts2.teacher_id = t.teacher_id
              AND s2.subject_name ILIKE '%' || p_subject_name || '%'
        ))
        AND (p_district IS NULL OR t.district ILIKE p_district)
        AND (p_gender IS NULL OR t.gender = p_gender)
        AND (p_min_rate IS NULL OR t.hourly_rate >= p_min_rate)
        AND (p_max_rate IS NULL OR t.hourly_rate <= p_max_rate)
    ORDER BY t.experience_years DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


DROP PROCEDURE IF EXISTS accept_post_application;
CREATE OR REPLACE PROCEDURE accept_post_application(
    IN p_application_id INTEGER,
    IN p_teacher_id INTEGER,
    OUT out_success BOOLEAN,
    OUT out_message TEXT,
    OUT out_match_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_post_id INTEGER;
    v_student_id INTEGER;
    v_post_owner_id INTEGER;
    v_current_status VARCHAR(20);
BEGIN
    out_success := FALSE;
    out_message := '';
    out_match_id := NULL;

    BEGIN
        -- Step 1: find the application, and lock this row so two accepts can't race
        SELECT a.post_id, a.student_id, a.status, tp.teacher_id
        INTO v_post_id, v_student_id, v_current_status, v_post_owner_id
        FROM teacher_post_applications a
        JOIN teacher_tuition_posts tp ON tp.post_id = a.post_id
        WHERE a.application_id = p_application_id
        FOR UPDATE;

        IF v_post_id IS NULL THEN
            out_message := 'Application not found';
            RETURN;
        END IF;

        IF v_post_owner_id <> p_teacher_id THEN
            out_message := 'You do not own this post';
            RETURN;
        END IF;

        IF v_current_status <> 'pending' THEN
            out_message := 'This application has already been ' || v_current_status;
            RETURN;
        END IF;

        -- Step 2: mark this application accepted
        UPDATE teacher_post_applications
        SET status = 'accepted'
        WHERE application_id = p_application_id;

        -- Step 3: reject every OTHER pending application for the same post
        UPDATE teacher_post_applications
        SET status = 'rejected'
        WHERE post_id = v_post_id
          AND application_id <> p_application_id
          AND status = 'pending';

        -- Step 4: create the match
        INSERT INTO matches (teacher_id, student_id, teacher_post_id, status)
        VALUES (p_teacher_id, v_student_id, v_post_id, 'active')
        RETURNING match_id INTO out_match_id;

        out_success := TRUE;
        out_message := 'Application accepted and match created';

    EXCEPTION WHEN OTHERS THEN
        out_success := FALSE;
        out_message := SQLERRM;
        out_match_id := NULL;
        RETURN;
    END;
END;
$$;

-- ============================================================
-- PROCEDURE: Mirror of accept_post_application for the other side of
-- the marketplace (Phase 3) -- a STUDENT accepts a TEACHER's application
-- to their own tuition request. Same shape: lock the row, verify the
-- caller owns the request, reject every other pending applicant, create
-- the match, wrap in exception handling. This was the missing half of
-- the application workflow flagged in the Phase 1 audit (the model
-- functions existed but nothing ever called accept/reject on this side).
-- ============================================================

DROP PROCEDURE IF EXISTS accept_request_application(INTEGER, INTEGER);
CREATE OR REPLACE PROCEDURE accept_request_application(
    IN p_application_id INTEGER,
    IN p_student_id INTEGER,
    OUT out_success BOOLEAN,
    OUT out_message TEXT,
    OUT out_match_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_request_id INTEGER;
    v_teacher_id INTEGER;
    v_request_owner_id INTEGER;
    v_current_status VARCHAR(20);
BEGIN
    out_success := FALSE;
    out_message := '';
    out_match_id := NULL;

    BEGIN
        -- Step 1: find the application, and lock this row so two accepts can't race
        SELECT a.request_id, a.teacher_id, a.status, sr.student_id
        INTO v_request_id, v_teacher_id, v_current_status, v_request_owner_id
        FROM student_request_applications a
        JOIN student_tuition_requests sr ON sr.request_id = a.request_id
        WHERE a.application_id = p_application_id
        FOR UPDATE;

        IF v_request_id IS NULL THEN
            out_message := 'Application not found';
            RETURN;
        END IF;

        IF v_request_owner_id <> p_student_id THEN
            out_message := 'You do not own this request';
            RETURN;
        END IF;

        IF v_current_status <> 'pending' THEN
            out_message := 'This application has already been ' || v_current_status;
            RETURN;
        END IF;

        -- Step 2: mark this application accepted
        UPDATE student_request_applications
        SET status = 'accepted'
        WHERE application_id = p_application_id;

        -- Step 3: reject every OTHER pending application for the same request
        UPDATE student_request_applications
        SET status = 'rejected'
        WHERE request_id = v_request_id
          AND application_id <> p_application_id
          AND status = 'pending';

        -- Step 4: create the match
        INSERT INTO matches (teacher_id, student_id, student_request_id, status)
        VALUES (v_teacher_id, p_student_id, v_request_id, 'active')
        RETURNING match_id INTO out_match_id;

        out_success := TRUE;
        out_message := 'Application accepted and match created';

    EXCEPTION WHEN OTHERS THEN
        out_success := FALSE;
        out_message := SQLERRM;
        out_match_id := NULL;
        RETURN;
    END;
END;
$$;
-- ============================================================
-- TRIGGER: Auto-update teacher's avg_rating whenever a review
-- is inserted, updated, or deleted
--
-- FIXED (database-foundation phase): the original version only ever
-- recalculated for NEW.reviewee_user_id. That silently went stale the
-- moment reviewee_user_id could change on an UPDATE -- which is exactly
-- what migration 003's `ON DELETE SET NULL` on reviews.reviewee_user_id
-- now causes when a teacher's account is deleted. The teacher's row
-- would keep its old avg_rating/total_reviews forever. Split into a
-- reusable recompute_teacher_rating() helper so both the old and the new
-- reviewee (when they differ) get recalculated.
-- ============================================================

CREATE OR REPLACE FUNCTION recompute_teacher_rating(p_teacher_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    IF p_teacher_user_id IS NULL THEN
        RETURN;
    END IF;

    -- If the reviewee wasn't a teacher (e.g. a student), there's nothing to update.
    UPDATE teachers
    SET
        avg_rating = COALESCE((
            SELECT ROUND(AVG(r.rating)::NUMERIC, 2)
            FROM reviews r
            WHERE r.reviewee_user_id = p_teacher_user_id
        ), 0),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews r
            WHERE r.reviewee_user_id = p_teacher_user_id
        )
    WHERE user_id = p_teacher_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_teacher_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recompute_teacher_rating(OLD.reviewee_user_id);
        RETURN NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recompute_teacher_rating(NEW.reviewee_user_id);
        IF NEW.reviewee_user_id IS DISTINCT FROM OLD.reviewee_user_id THEN
            PERFORM recompute_teacher_rating(OLD.reviewee_user_id);
        END IF;
        RETURN NULL;
    ELSE -- INSERT
        PERFORM recompute_teacher_rating(NEW.reviewee_user_id);
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_review_change ON reviews;
CREATE TRIGGER after_review_change
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_rating();

-- ============================================================
-- TRIGGER: A review may only be created against a match that
-- hasn't been cancelled, and only by the student on that match.
--
-- The API (review.controller.js) already checks the reviewer owns the
-- match; this trigger backs that with a database-level guarantee that
-- holds no matter which code path inserts the row. The status check is
-- intentionally "not cancelled" rather than "must be completed": there is
-- currently no workflow step anywhere in the app that ever moves a match
-- out of 'active', so requiring 'completed' here would make it
-- impossible to leave any review at all. Tighten this to
-- `v_match_status <> 'completed'` once a "mark match completed" feature
-- exists (see audit notes).
-- ============================================================

CREATE OR REPLACE FUNCTION validate_review_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_match_status VARCHAR(20);
    v_match_student_user_id INTEGER;
BEGIN
    SELECT m.status, u.user_id
    INTO v_match_status, v_match_student_user_id
    FROM matches m
    JOIN students s ON s.student_id = m.student_id
    JOIN users u ON u.user_id = s.user_id
    WHERE m.match_id = NEW.match_id;

    IF v_match_status IS NULL THEN
        RAISE EXCEPTION 'Match % does not exist.', NEW.match_id;
    END IF;

    IF v_match_status = 'cancelled' THEN
        RAISE EXCEPTION 'You cannot review a cancelled match.';
    END IF;

    IF NEW.reviewer_user_id IS DISTINCT FROM v_match_student_user_id THEN
        RAISE EXCEPTION 'Only the student on this match can leave this review.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_review_insert ON reviews;
CREATE TRIGGER before_review_insert
    BEFORE INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION validate_review_before_insert();
    -- ============================================================
-- TRIGGER: Notify the student when their post-application status changes
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_student_user_id INTEGER;
    v_post_title VARCHAR(150);
BEGIN
    -- only fire when status actually changed (not on every UPDATE)
    IF NEW.status = OLD.status THEN
        RETURN NULL;
    END IF;

    SELECT u.user_id, tp.title
    INTO v_student_user_id, v_post_title
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    JOIN teacher_tuition_posts tp ON tp.post_id = NEW.post_id
    WHERE s.student_id = NEW.student_id;

    IF NEW.status = 'accepted' THEN
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (
            v_student_user_id,
            'application_accepted',
            'Your application for "' || v_post_title || '" was accepted!',
            '/teacher-posts/' || NEW.post_id
        );
    ELSIF NEW.status = 'rejected' THEN
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (
            v_student_user_id,
            'application_rejected',
            'Your application for "' || v_post_title || '" was not selected.',
            '/teacher-posts/' || NEW.post_id
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_application_status_change ON teacher_post_applications;
CREATE TRIGGER after_application_status_change
    AFTER UPDATE ON teacher_post_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_application_status_change();

    -- ============================================================
-- TRIGGER: Notify the question-asker when someone answers
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_new_answer()
RETURNS TRIGGER AS $$
DECLARE
    v_question_owner_id INTEGER;
    v_question_title VARCHAR(150);
BEGIN
    SELECT user_id, title INTO v_question_owner_id, v_question_title
    FROM questions
    WHERE question_id = NEW.question_id;

    -- don't notify someone for answering their own question
    IF v_question_owner_id = NEW.user_id THEN
        RETURN NULL;
    END IF;

    INSERT INTO notifications (user_id, type, message, link)
    VALUES (
        v_question_owner_id,
        'new_answer',
        'Someone answered your question: "' || v_question_title || '"',
        '/questions/' || NEW.question_id
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_answer_insert ON answers;
CREATE TRIGGER after_answer_insert
    AFTER INSERT ON answers
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_answer();

-- ============================================================
-- PROCEDURE: Admin approves a pending teacher application.
--
-- Multi-step + transactional: locks the user row, flips account_status,
-- and writes an audit log entry, all inside one implicit transaction
-- (a procedure body runs atomically -- if anything after the UPDATE
-- fails, the UPDATE itself is rolled back too). The teacher's own
-- notification is NOT inserted here -- it's handled by the
-- after_account_status_change trigger below, so it fires no matter which
-- code path changes the status, not just this one.
-- ============================================================

DROP PROCEDURE IF EXISTS approve_teacher(INTEGER, INTEGER);
CREATE OR REPLACE PROCEDURE approve_teacher(
    IN p_admin_id INTEGER,
    IN p_teacher_user_id INTEGER,
    OUT out_success BOOLEAN,
    OUT out_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_role user_role;
    v_status VARCHAR(20);
BEGIN
    out_success := FALSE;
    out_message := '';

    BEGIN
        SELECT role, account_status INTO v_role, v_status
        FROM users
        WHERE user_id = p_teacher_user_id
        FOR UPDATE;

        IF v_role IS NULL THEN
            out_message := 'User not found';
            RETURN;
        END IF;

        IF v_role <> 'teacher' THEN
            out_message := 'This user is not a teacher account';
            RETURN;
        END IF;

        IF v_status <> 'pending' THEN
            out_message := 'This teacher is already ' || v_status;
            RETURN;
        END IF;

        UPDATE users SET account_status = 'active' WHERE user_id = p_teacher_user_id;

        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (p_admin_id, 'teacher_approved', 'user', p_teacher_user_id, NULL);

        out_success := TRUE;
        out_message := 'Teacher approved';

    EXCEPTION WHEN OTHERS THEN
        out_success := FALSE;
        out_message := SQLERRM;
    END;
END;
$$;

-- ============================================================
-- PROCEDURE: Admin rejects a pending teacher application.
-- Same shape as approve_teacher, records the admin's reason.
-- ============================================================

DROP PROCEDURE IF EXISTS reject_teacher(INTEGER, INTEGER, TEXT);
CREATE OR REPLACE PROCEDURE reject_teacher(
    IN p_admin_id INTEGER,
    IN p_teacher_user_id INTEGER,
    IN p_reason TEXT,
    OUT out_success BOOLEAN,
    OUT out_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_role user_role;
    v_status VARCHAR(20);
BEGIN
    out_success := FALSE;
    out_message := '';

    BEGIN
        SELECT role, account_status INTO v_role, v_status
        FROM users
        WHERE user_id = p_teacher_user_id
        FOR UPDATE;

        IF v_role IS NULL THEN
            out_message := 'User not found';
            RETURN;
        END IF;

        IF v_role <> 'teacher' THEN
            out_message := 'This user is not a teacher account';
            RETURN;
        END IF;

        IF v_status <> 'pending' THEN
            out_message := 'This teacher is already ' || v_status;
            RETURN;
        END IF;

        UPDATE users SET account_status = 'rejected' WHERE user_id = p_teacher_user_id;

        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (
            p_admin_id, 'teacher_rejected', 'user', p_teacher_user_id,
            jsonb_build_object('reason', p_reason)
        );

        out_success := TRUE;
        out_message := 'Teacher rejected';

    EXCEPTION WHEN OTHERS THEN
        out_success := FALSE;
        out_message := SQLERRM;
    END;
END;
$$;

-- ============================================================
-- PROCEDURE: Admin suspends or reactivates any existing account
-- (student, teacher, or another admin). One generic, reusable procedure
-- instead of near-identical suspend/activate copies. Deliberately refuses
-- to touch a pending/rejected teacher -- that transition belongs to
-- approve_teacher/reject_teacher, which carry their own audit action names.
-- ============================================================

DROP PROCEDURE IF EXISTS set_user_account_status(INTEGER, INTEGER, VARCHAR, TEXT);
CREATE OR REPLACE PROCEDURE set_user_account_status(
    IN p_admin_id INTEGER,
    IN p_target_user_id INTEGER,
    IN p_new_status VARCHAR(20),
    IN p_reason TEXT,
    OUT out_success BOOLEAN,
    OUT out_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_status VARCHAR(20);
BEGIN
    out_success := FALSE;
    out_message := '';

    IF p_new_status NOT IN ('active', 'suspended') THEN
        out_message := 'new_status must be active or suspended';
        RETURN;
    END IF;

    BEGIN
        SELECT account_status INTO v_current_status
        FROM users
        WHERE user_id = p_target_user_id
        FOR UPDATE;

        IF v_current_status IS NULL THEN
            out_message := 'User not found';
            RETURN;
        END IF;

        IF v_current_status = p_new_status THEN
            out_message := 'User is already ' || p_new_status;
            RETURN;
        END IF;

        IF v_current_status IN ('pending', 'rejected') THEN
            out_message := 'Use approve_teacher/reject_teacher for a pending or rejected teacher';
            RETURN;
        END IF;

        UPDATE users SET account_status = p_new_status WHERE user_id = p_target_user_id;

        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (
            p_admin_id,
            CASE WHEN p_new_status = 'suspended' THEN 'user_suspended' ELSE 'user_activated' END,
            'user', p_target_user_id,
            jsonb_build_object('reason', p_reason)
        );

        out_success := TRUE;
        out_message := 'User status updated to ' || p_new_status;

    EXCEPTION WHEN OTHERS THEN
        out_success := FALSE;
        out_message := SQLERRM;
    END;
END;
$$;

-- ============================================================
-- TRIGGER: Notify a user whenever an admin changes their
-- account_status (teacher approved/rejected, any account
-- suspended/reactivated).
--
-- Lives as a trigger on the actual data change -- not inside the
-- procedures above -- so it fires no matter which code path performs the
-- UPDATE, consistent with the other notification triggers in this file.
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_account_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_message TEXT;
BEGIN
    v_message := CASE NEW.account_status
        WHEN 'active'    THEN CASE WHEN OLD.account_status = 'pending'
                                    THEN 'Your teacher account has been approved. You can now use all teacher features.'
                                    ELSE 'Your account has been reactivated.' END
        WHEN 'rejected'  THEN 'Your teacher application was not approved.'
        WHEN 'suspended' THEN 'Your account has been suspended. Contact support for details.'
        ELSE NULL
    END;

    IF v_message IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (NEW.user_id, 'account_status_change', v_message, '/account/settings');
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_account_status_change ON users;
CREATE TRIGGER after_account_status_change
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN (NEW.account_status IS DISTINCT FROM OLD.account_status)
    EXECUTE FUNCTION notify_on_account_status_change();

-- ============================================================
-- FUNCTION: One round-trip for every number the admin dashboard needs, so
-- the dashboard (next phase) never hard-codes a statistic (spec section 16).
-- ============================================================

CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE (
    total_students INTEGER,
    total_teachers INTEGER,
    pending_teachers INTEGER,
    suspended_users INTEGER,
    active_teacher_posts INTEGER,
    active_student_requests INTEGER,
    total_applications INTEGER,
    total_matches INTEGER,
    total_questions INTEGER,
    total_resources INTEGER,
    pending_reports INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student')::INTEGER,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher')::INTEGER,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND account_status = 'pending')::INTEGER,
        (SELECT COUNT(*) FROM users WHERE account_status = 'suspended')::INTEGER,
        (SELECT COUNT(*) FROM teacher_tuition_posts WHERE status = 'active')::INTEGER,
        (SELECT COUNT(*) FROM student_tuition_requests WHERE status = 'active')::INTEGER,
        ((SELECT COUNT(*) FROM teacher_post_applications) +
         (SELECT COUNT(*) FROM student_request_applications))::INTEGER,
        (SELECT COUNT(*) FROM matches)::INTEGER,
        (SELECT COUNT(*) FROM questions)::INTEGER,
        (SELECT COUNT(*) FROM resources)::INTEGER,
        (SELECT COUNT(*) FROM reports WHERE status = 'pending')::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- PROCEDURE: Admin deletes a student or teacher account entirely.
--
-- Deliberately refuses to delete an admin account this way. The DELETE
-- itself relies on the ON DELETE behavior already defined on every other
-- table's foreign keys (migrations 002/003): a user with match/review
-- history cannot be hard-deleted (RESTRICT on matches.teacher_id/
-- student_id) -- that FK violation is caught below and turned into a
-- clear message instead of a raw Postgres error reaching the API.
--
-- The audit log entry is written BEFORE the delete, inside the same
-- exception block, so if the delete fails (e.g. the RESTRICT above), the
-- implicit savepoint this block creates rolls the audit insert back too
-- -- there is never a "user deleted" audit entry for a deletion that
-- didn't actually happen.
-- ============================================================

DROP PROCEDURE IF EXISTS delete_user_account(INTEGER, INTEGER, TEXT);
CREATE OR REPLACE PROCEDURE delete_user_account(
    IN p_admin_id INTEGER,
    IN p_target_user_id INTEGER,
    IN p_reason TEXT,
    OUT out_success BOOLEAN,
    OUT out_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_role user_role;
BEGIN
    out_success := FALSE;
    out_message := '';

    BEGIN
        SELECT role INTO v_role
        FROM users
        WHERE user_id = p_target_user_id
        FOR UPDATE;

        IF v_role IS NULL THEN
            out_message := 'User not found';
            RETURN;
        END IF;

        IF v_role = 'admin' THEN
            out_message := 'Admin accounts cannot be deleted this way';
            RETURN;
        END IF;

        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (
            p_admin_id, 'user_deleted', 'user', p_target_user_id,
            jsonb_build_object('reason', p_reason, 'role', v_role)
        );

        DELETE FROM users WHERE user_id = p_target_user_id;

        out_success := TRUE;
        out_message := 'User account deleted';

    EXCEPTION
        WHEN foreign_key_violation THEN
            out_success := FALSE;
            out_message := 'This account has match or review history and cannot be deleted. Suspend it instead.';
        WHEN OTHERS THEN
            out_success := FALSE;
            out_message := SQLERRM;
    END;
END;
$$;