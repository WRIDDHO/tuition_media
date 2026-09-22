-- Migration 001: Teacher verification workflow (account_status)
--
-- Extends users.account_status from ('active','suspended') to support the
-- teacher approval pipeline required by the admin system:
--   pending   -> teacher just registered, awaiting admin review
--   active    -> normal usable account (students go active immediately;
--                teachers become active only once an admin approves them)
--   rejected  -> admin rejected the teacher's application
--   suspended -> admin disabled an existing account (any role)
--
-- Data compatibility: every existing row already has 'active' or
-- 'suspended', and both remain valid values under the new CHECK, so no
-- existing row needs to change. Nothing here alters application code --
-- the auth/teacher controllers still need to be updated (next phase) to
-- actually insert new teachers as 'pending' instead of relying on the
-- column default of 'active'.

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;

ALTER TABLE users
  ADD CONSTRAINT users_account_status_check
  CHECK (account_status IN ('pending', 'active', 'rejected', 'suspended'));

COMMENT ON COLUMN users.account_status IS
  'pending = teacher awaiting admin review; active = usable account; '
  'rejected = teacher application denied; suspended = admin-disabled account. '
  'Students go active immediately at registration; teachers start pending.';

COMMIT;
