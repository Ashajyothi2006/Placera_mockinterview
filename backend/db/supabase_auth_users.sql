-- ==============================================================================
-- PLACERA AI: Authentication & User Profiles Schema for Supabase PostgreSQL
-- ==============================================================================

-- 1. Create placera_users table
CREATE TABLE IF NOT EXISTS public.placera_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Candidate',
    target_role TEXT NOT NULL DEFAULT 'Software Developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_placera_users_email ON public.placera_users (email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.placera_users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Users can read and update their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.placera_users;
CREATE POLICY "Users can read own profile"
    ON public.placera_users
    FOR SELECT
    USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Users can update own profile" ON public.placera_users;
CREATE POLICY "Users can update own profile"
    ON public.placera_users
    FOR UPDATE
    USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email');
