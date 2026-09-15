-- Direct administrator provisioning with one-time temporary passwords.
-- Apply with the matching backend/frontend release, first in staging.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS temporary_password_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;

-- Password intent is owned by the application endpoints. A generic auth.users
-- trigger cannot distinguish an administrator-issued temporary password from
-- a user-selected permanent password, so it must not clear the requirement.
DROP TRIGGER IF EXISTS practicum_password_changed ON auth.users;
DROP FUNCTION IF EXISTS public.auth_password_changed();

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid,
  target_user_id uuid,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_audit_log_created_at_idx
  ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS security_audit_log_target_idx
  ON public.security_audit_log(target_user_id, created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.security_audit_log TO service_role;

COMMIT;
