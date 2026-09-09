-- ========================================================================
-- 03_auth_and_profiles.sql
-- User Profiles, OTP Verification, and Row Level Security (RLS) Policies
-- ========================================================================

-- 1. Profiles Table (Linked to Supabase auth.users or Standalone)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'adviser', 'supervisor', 'admin')),
    student_id TEXT,
    program TEXT,
    section TEXT,
    contact_number TEXT,
    department TEXT,
    company_name TEXT,
    company_id TEXT,
    supervisor_id TEXT,
    adviser_id TEXT,
    is_activated BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Pending')),
    requires_password_change BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enrolled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column additions if profiles table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_enrolled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Auth OTPs Table (Tracks OTP lifecycle, brute-force limits, and lockout)
CREATE TABLE IF NOT EXISTS public.auth_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('account_activation', 'password_reset', 'login_verify')),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    locked_until TIMESTAMPTZ,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_auth_otps_email_purpose ON public.auth_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_auth_otps_token ON public.auth_otps(verification_token);

-- 3. Trigger Function for Updated At
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_profiles_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- 4. Row Level Security & InitPlan Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and manage profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT TO authenticated, anon
USING (
    id = (SELECT auth.uid()) 
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser', 'service_role')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
    OR true
);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" 
ON public.profiles FOR INSERT TO authenticated, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE TO authenticated, anon
USING (
    id = (SELECT auth.uid())
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser', 'service_role')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
    OR true
)
WITH CHECK (true);

-- Auth OTPs: Managed by API / backend
DROP POLICY IF EXISTS "auth_otps_policy" ON public.auth_otps;
CREATE POLICY "auth_otps_policy" 
ON public.auth_otps FOR ALL TO authenticated, anon
USING (true)
WITH CHECK (true);
