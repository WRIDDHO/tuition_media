-- Migration 007: Match-based moderation system
--
-- Replaces the never-used reports table from migration 005 with a
-- match-bound design (mirrors the existing reviews table's
-- match_id + reviewer_user_id + reviewee_user_id pattern -- that table
-- already solved the "only participants in a match can target each
-- other" problem, so this reuses the same shape rather than inventing a
-- new one). Adds report_evidence and warnings, and a suspended_until
-- column for time-boxed suspensions (lazy-checked at login, no
-- scheduler). audit_logs and notifications are reused as-is.
--
-- Depends on: migration 002 (set_updated_at()), migration 005 (dropped
-- and replaced here), matches/reviews/users/notifications/audit_logs
-- from schema.sql.

BEGIN;

-- ============================================================
-- 1. Drop the old, unused reports table and rebuild it bound to a match
-- ============================================================

DROP TABLE IF EXISTS reports CASCADE;

CREATE TABLE reports (
    report_id                SERIAL PRIMARY KEY,
    match_id                 INT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    reporter_user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reported_user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason                   VARCHAR(50) NOT NULL CHECK (reason IN (
                                 'misbehavior', 'harassment', 'inappropriate_communication',
                                 'fake_information', 'payment_issue', 'failure_to_attend',
                                 'repeated_cancellation', 'academic_misconduct',
                                 'fraud_scam', 'agreement_violation', 'other'
                             )),
    description              TEXT NOT NULL,
    status                   VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
                                 'pending', 'under_review', 'explanation_requested',
                                 'explanation_received', 'resolved', 'dismissed'
                             )),
    explanation              TEXT,
    explanation_requested_at TIMESTAMPTZ,
    explanation_deadline     TIMESTAMPTZ,
    explanation_submitted_at TIMESTAMPTZ,
    resolved_by              INT REFERENCES users(user_id) ON DELETE SET NULL,
    resolution_action        VARCHAR(30) CHECK (resolution_action IN (
                                 'dismiss', 'warning', 'temporary_suspension',
                                 'permanent_suspension', 'account_deletion'
                             )),
    resolution_note          TEXT,
    resolved_at              TIMESTAMPTZ,
    created_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (reporter_user_id != reported_user_id)
);

COMMENT ON TABLE reports IS
  'A report is always bound to a specific match; reported_user_id must be '
  'the other participant of that match, enforced by create_match_report() '
  'below -- the same reviewer/reviewee-vs-match pattern the reviews table '
  'already uses. resolution_action records the admin''s final decision '
  '(distinct from status, which tracks where the case is in the workflow).';

-- One open case per (match, reporter) at a time -- stops duplicate spam
-- while a report is still active, without permanently blocking a fresh
-- report if the same problem recurs after this one is closed.
CREATE UNIQUE INDEX uq_reports_open_per_match
    ON reports (match_id, reporter_user_id)
    WHERE status NOT IN ('resolved', 'dismissed');

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_match ON reports(match_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. Evidence: one report can have many files
-- ============================================================

CREATE TABLE report_evidence (
    evidence_id        SERIAL PRIMARY KEY,
    report_id          INT NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    uploaded_by        INT REFERENCES users(user_id) ON DELETE SET NULL,
    file_url           VARCHAR(255) NOT NULL,
    original_filename  VARCHAR(255),
    uploaded_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE report_evidence IS
  'Files attached to a report (screenshots, payment proof, documents). '
  'uploaded_by is nullable with ON DELETE SET NULL so the file record '
  'survives even if the uploading account is later deleted -- the report '
  'and its evidence must remain readable to admins regardless.';

CREATE INDEX idx_report_evidence_report ON report_evidence(report_id);

-- ============================================================
-- 3. Warning history (separate from the final resolution_action on the
--    report itself -- a warning is one *possible outcome*, but is kept
--    in its own table so a user's full warning history is queryable
--    independent of any single report)
-- ============================================================

CREATE TABLE warnings (
    warning_id   SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    report_id    INT REFERENCES reports(report_id) ON DELETE SET NULL,
    issued_by    INT REFERENCES users(user_id) ON DELETE SET NULL,
    reason       TEXT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE warnings IS
  'Warning history for a user. report_id is nullable/SET NULL so a '
  'warning record outlives the report it came from if that report is '
  'ever removed; issuing a warning never auto-triggers further action -- '
  'the admin decides every subsequent step manually.';

CREATE INDEX idx_warnings_user ON warnings(user_id);

-- ============================================================
-- 4. Time-boxed suspension: lazy-checked at login, no scheduler
-- ============================================================

ALTER TABLE users ADD COLUMN suspended_until TIMESTAMPTZ;

COMMENT ON COLUMN users.suspended_until IS
  'NULL + account_status=''suspended'' = permanent suspension. '
  'A future timestamp + account_status=''suspended'' = temporary '
  'suspension; reactivate_if_suspension_expired() lazily flips the '
  'account back to ''active'' the next time that user logs in, once this '
  'timestamp has passed. No background job checks this column.';

-- ============================================================
-- 5. Procedures
-- ============================================================

-- Validates the reporter is actually a participant of the match, derives
-- the reported user as the *other* participant (never trusts a
-- client-supplied reported_user_id), and creates the report plus its
-- notifications in one transaction.
CREATE OR REPLACE PROCEDURE create_match_report(
    IN  p_reporter_user_id INTEGER,
    IN  p_match_id         INTEGER,
    IN  p_reason           VARCHAR(50),
    IN  p_description      TEXT,
    OUT out_success        BOOLEAN,
    OUT out_message        TEXT,
    OUT out_report_id       INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_teacher_user_id  INTEGER;
    v_student_user_id  INTEGER;
    v_reported_user_id INTEGER;
BEGIN
    out_success  := FALSE;
    out_report_id := NULL;

    SELECT tu.user_id, su.user_id
    INTO v_teacher_user_id, v_student_user_id
    FROM matches m
    JOIN teachers t ON t.teacher_id = m.teacher_id
    JOIN users tu   ON tu.user_id = t.user_id
    JOIN students s ON s.student_id = m.student_id
    JOIN users su   ON su.user_id = s.user_id
    WHERE m.match_id = p_match_id;

    IF v_teacher_user_id IS NULL THEN
        out_message := 'Match not found.';
        RETURN;
    END IF;

    IF p_reporter_user_id != v_teacher_user_id AND p_reporter_user_id != v_student_user_id THEN
        out_message := 'You are not a participant in this match.';
        RETURN;
    END IF;

    v_reported_user_id := CASE WHEN p_reporter_user_id = v_teacher_user_id
                                THEN v_student_user_id ELSE v_teacher_user_id END;

    INSERT INTO reports (match_id, reporter_user_id, reported_user_id, reason, description)
    VALUES (p_match_id, p_reporter_user_id, v_reported_user_id, p_reason, p_description)
    RETURNING report_id INTO out_report_id;

    INSERT INTO notifications (user_id, type, message, link)
    SELECT user_id, 'new_report', 'New user report requires review.',
           '/admin?tab=reports&report=' || out_report_id
    FROM users WHERE role = 'admin';

    INSERT INTO notifications (user_id, type, message, link)
    VALUES (p_reporter_user_id, 'report_submitted',
            'Your report has been submitted successfully.', '/reports/' || out_report_id);

    out_success := TRUE;
    out_message := 'Report submitted.';
EXCEPTION
    WHEN unique_violation THEN
        out_success := FALSE;
        out_message := 'You already have an open report for this match.';
END;
$$;

-- Admin asks the reported user to explain themselves; records the
-- deadline and notifies them. Only valid from pending/under_review.
CREATE OR REPLACE PROCEDURE request_report_explanation(
    IN  p_admin_id       INTEGER,
    IN  p_report_id      INTEGER,
    IN  p_deadline_hours INTEGER,
    OUT out_success      BOOLEAN,
    OUT out_message      TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reported_user_id INTEGER;
BEGIN
    out_success := FALSE;

    UPDATE reports
    SET status = 'explanation_requested',
        explanation_requested_at = NOW(),
        explanation_deadline = NOW() + (p_deadline_hours || ' hours')::INTERVAL
    WHERE report_id = p_report_id
      AND status IN ('pending', 'under_review')
    RETURNING reported_user_id INTO v_reported_user_id;

    IF v_reported_user_id IS NULL THEN
        out_message := 'Report not found or not in a reviewable state.';
        RETURN;
    END IF;

    INSERT INTO notifications (user_id, type, message, link)
    VALUES (v_reported_user_id, 'explanation_requested',
            'An administrator has requested an explanation regarding a report associated with your match.',
            '/reports/' || p_report_id);

    INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
    VALUES (p_admin_id, 'EXPLANATION_REQUESTED', 'report', p_report_id,
            jsonb_build_object('deadline_hours', p_deadline_hours));

    out_success := TRUE;
    out_message := 'Explanation requested.';
END;
$$;

-- The reported user submits their side. Only the actual reported_user_id
-- can call this successfully, and only while explanation_requested.
CREATE OR REPLACE PROCEDURE submit_report_explanation(
    IN  p_user_id     INTEGER,
    IN  p_report_id   INTEGER,
    IN  p_explanation TEXT,
    OUT out_success   BOOLEAN,
    OUT out_message   TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_found INTEGER;
BEGIN
    out_success := FALSE;

    UPDATE reports
    SET explanation = p_explanation,
        explanation_submitted_at = NOW(),
        status = 'explanation_received'
    WHERE report_id = p_report_id
      AND reported_user_id = p_user_id
      AND status = 'explanation_requested'
    RETURNING report_id INTO v_found;

    IF v_found IS NULL THEN
        out_message := 'Report not found, not yours to explain, or no explanation was requested.';
        RETURN;
    END IF;

    INSERT INTO notifications (user_id, type, message, link)
    SELECT user_id, 'explanation_submitted', 'A reported user has submitted an explanation.',
           '/admin?tab=reports&report=' || p_report_id
    FROM users WHERE role = 'admin';

    INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
    VALUES (NULL, 'EXPLANATION_SUBMITTED', 'report', p_report_id, NULL);

    out_success := TRUE;
    out_message := 'Explanation submitted.';
END;
$$;

-- Admin's final decision. One transaction: update the report, apply the
-- consequence (warning row / suspension / deletion), write the audit log,
-- and notify both sides. If the consequence step fails (e.g. deleting a
-- user hits an FK RESTRICT elsewhere), the whole thing rolls back -- the
-- report is never left half-resolved with no consequence applied, or
-- vice versa.
CREATE OR REPLACE PROCEDURE resolve_report(
    IN  p_admin_id         INTEGER,
    IN  p_report_id        INTEGER,
    IN  p_action           VARCHAR(30), -- dismiss|warning|temporary_suspension|permanent_suspension|account_deletion
    IN  p_decision_note    TEXT,
    IN  p_suspension_days  INTEGER,     -- only used for temporary_suspension
    OUT out_success        BOOLEAN,
    OUT out_message        TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reported_user_id INTEGER;
    v_reporter_user_id INTEGER;
    v_final_status     VARCHAR(30);
BEGIN
    out_success := FALSE;

    SELECT reported_user_id, reporter_user_id
    INTO v_reported_user_id, v_reporter_user_id
    FROM reports
    WHERE report_id = p_report_id
    FOR UPDATE;

    IF v_reported_user_id IS NULL THEN
        out_message := 'Report not found.';
        RETURN;
    END IF;

    IF (SELECT role FROM users WHERE user_id = v_reported_user_id) = 'admin' THEN
        out_message := 'Admin accounts cannot be moderated through this workflow.';
        RETURN;
    END IF;

    v_final_status := CASE WHEN p_action = 'dismiss' THEN 'dismissed' ELSE 'resolved' END;

    UPDATE reports
    SET status = v_final_status,
        resolved_by = p_admin_id,
        resolution_action = p_action,
        resolution_note = p_decision_note,
        resolved_at = NOW()
    WHERE report_id = p_report_id;

    IF p_action = 'warning' THEN
        INSERT INTO warnings (user_id, report_id, issued_by, reason)
        VALUES (v_reported_user_id, p_report_id, p_admin_id, p_decision_note);

    ELSIF p_action = 'temporary_suspension' THEN
        UPDATE users
        SET account_status = 'suspended',
            suspended_until = NOW() + (p_suspension_days || ' days')::INTERVAL
        WHERE user_id = v_reported_user_id;

    ELSIF p_action = 'permanent_suspension' THEN
        UPDATE users
        SET account_status = 'suspended', suspended_until = NULL
        WHERE user_id = v_reported_user_id;

    ELSIF p_action = 'account_deletion' THEN
        DELETE FROM users WHERE user_id = v_reported_user_id;
    END IF;

    INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
    VALUES (p_admin_id, 'REPORT_RESOLVED_' || UPPER(p_action), 'report', p_report_id,
            jsonb_build_object('reported_user_id', v_reported_user_id,
                                'note', p_decision_note,
                                'suspension_days', p_suspension_days));

    INSERT INTO notifications (user_id, type, message, link) VALUES
        (v_reported_user_id, 'moderation_action',
         'An administrative action has been taken regarding your account.', '/reports'),
        (v_reporter_user_id, 'report_resolved',
         'Your report has been reviewed by an administrator.', '/reports/' || p_report_id);

    out_success := TRUE;
    out_message := 'Report resolved.';
EXCEPTION
    WHEN foreign_key_violation THEN
        out_success := FALSE;
        out_message := 'This account has other linked history (matches/reviews) and cannot be permanently deleted. Consider a permanent suspension instead.';
END;
$$;

-- Lazy reactivation: called at the start of every login attempt, before
-- the account_status check. A no-op for permanent suspensions (no
-- suspended_until) and for accounts that are not suspended at all.
CREATE OR REPLACE PROCEDURE reactivate_if_suspension_expired(
    IN  p_user_id        INTEGER,
    OUT out_reactivated  BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    out_reactivated := FALSE;

    UPDATE users
    SET account_status = 'active', suspended_until = NULL
    WHERE user_id = p_user_id
      AND account_status = 'suspended'
      AND suspended_until IS NOT NULL
      AND suspended_until <= NOW();

    IF FOUND THEN
        out_reactivated := TRUE;
        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (NULL, 'SUSPENSION_EXPIRED_AUTO_REACTIVATED', 'user', p_user_id, NULL);
    END IF;
END;
$$;

COMMIT;