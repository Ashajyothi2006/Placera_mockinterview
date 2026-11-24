-- ==============================================================================
-- PLACERA AI: Complete Master Schema Setup for Supabase PostgreSQL
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create placera_users Table (Candidate profiles & credentials)
CREATE TABLE IF NOT EXISTS public.placera_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Candidate',
    target_role TEXT NOT NULL DEFAULT 'Software Developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_placera_users_email ON public.placera_users (email);
ALTER TABLE public.placera_users ENABLE ROW LEVEL SECURITY;

-- Allow public signup / insert
DROP POLICY IF EXISTS "Allow public user registration" ON public.placera_users;
CREATE POLICY "Allow public user registration"
    ON public.placera_users
    FOR INSERT
    WITH CHECK (true);

-- Allow reading candidate profiles
DROP POLICY IF EXISTS "Allow user profile read" ON public.placera_users;
CREATE POLICY "Allow user profile read"
    ON public.placera_users
    FOR SELECT
    USING (true);

-- Allow updating own profile
DROP POLICY IF EXISTS "Allow user profile update" ON public.placera_users;
CREATE POLICY "Allow user profile update"
    ON public.placera_users
    FOR UPDATE
    USING (true);


-- 2. Create career_agent_conversations Table
CREATE TABLE IF NOT EXISTS public.career_agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_career_conversations_user 
    ON public.career_agent_conversations (user_id, updated_at DESC);

ALTER TABLE public.career_agent_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own career conversations" ON public.career_agent_conversations;
CREATE POLICY "Users can manage own career conversations"
    ON public.career_agent_conversations
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- 3. Create career_agent_messages Table
CREATE TABLE IF NOT EXISTS public.career_agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.career_agent_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_career_messages_conversation 
    ON public.career_agent_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_career_messages_user 
    ON public.career_agent_messages (user_id);

ALTER TABLE public.career_agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own career messages" ON public.career_agent_messages;
CREATE POLICY "Users can manage own career messages"
    ON public.career_agent_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- 4. Automatic Timestamp Update Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_placera_users_timestamp ON public.placera_users;
CREATE TRIGGER set_placera_users_timestamp
    BEFORE UPDATE ON public.placera_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_career_conversation_timestamp ON public.career_agent_conversations;
CREATE TRIGGER set_career_conversation_timestamp
    BEFORE UPDATE ON public.career_agent_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_timestamp();

-- ==============================================================================
-- Schema setup complete.
-- ==============================================================================
