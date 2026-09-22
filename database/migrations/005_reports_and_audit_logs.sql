-- Migration 005: Reports and audit logs
--
-- Two new tables supporting the upcoming admin/moderation system.
--
-- Both use a polymorphic (target_type, target_id) pair instead of a real
-- foreign key, because a single report or log entry needs to be able to
-- point at any one of several unrelated tables (a post, a question, a
-- user account...). This is a deliberate normalization trade-off, not an
-- oversight: a real FK can only ever reference one table, so enforcing
-- target_id integrity happens at the application layer (the admin
-- controllers, next phase) -- the same pattern most moderation/audit
-- systems use for exactly this reason.
--
-- Depends on: migration 002 (set_updated_at() function/pattern).

BEGIN;

CREATE TABLE IF NOT EXISTS reports (
    report_id         SERIAL PRIMARY KEY,
    reporter_user_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_type       VARCHAR(30) NOT NULL CHECK (target_type IN (
                           'teacher_post', 'student_request', 'teacher',
                           'student', 'question', 'answer', 'resource'
                       )),
    target_id         INT NOT NULL,
    reason            VARCHAR(100) NOT NULL,
    description       TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    resolved_by       INT REFERENCES users(user_id) ON DELETE SET NULL,
    resolution_note   TEXT,
    resolved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- One open (pending) report per reporter/target is enough to get admin
-- attention -- this stops the same person spamming the same report while
-- it's still unresolved, without permanently blocking a fresh report
-- later if the same problem recurs after being dismissed/resolved.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_open_duplicate
    ON reports (reporter_user_id, target_type, target_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id       SERIAL PRIMARY KEY,
    admin_id     INT REFERENCES users(user_id) ON DELETE SET NULL,
    action       VARCHAR(50) NOT NULL,
    target_type  VARCHAR(30) NOT NULL,
    target_id    INT,
    details      JSONB,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- admin_id is nullable with ON DELETE SET NULL on purpose: the record of
-- what happened and to whom must outlive the admin account that did it.
-- No updated_at here -- an audit log entry is never edited after the fact.

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMIT;
