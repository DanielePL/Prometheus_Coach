-- ═══════════════════════════════════════════════════════════════════════════
-- PROMETHEUS CHAT SYSTEM - DEFINITIVE FIX
-- Run this ONCE in Supabase SQL Editor
-- This script harmonizes Android App + Coach Desktop
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: DROP ALL OLD POLICIES (clean slate)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop ALL policies on conversations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on conversations', pol.policyname;
    END LOOP;

    -- Drop ALL policies on conversation_participants
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversation_participants', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on conversation_participants', pol.policyname;
    END LOOP;

    -- Drop ALL policies on messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on messages', pol.policyname;
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: DROP OLD FUNCTIONS (we'll recreate them)
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS find_or_create_conversation(UUID);
DROP FUNCTION IF EXISTS find_shared_conversation(UUID);
DROP FUNCTION IF EXISTS get_other_participant(UUID);
DROP FUNCTION IF EXISTS get_conversation_participants(UUID);
DROP FUNCTION IF EXISTS get_user_conversations();

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: CREATE NEW RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- CONVERSATIONS TABLE
-- ───────────────────────────────────────────────────────────────────────────

-- SELECT: Users can view conversations they participate in
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
        )
    );

-- INSERT: Any authenticated user can create conversations
CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Participants can update their conversations
CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
        )
    );

-- ───────────────────────────────────────────────────────────────────────────
-- CONVERSATION_PARTICIPANTS TABLE
-- ───────────────────────────────────────────────────────────────────────────

-- SELECT: Users can ONLY see their own participant records
-- (Use RPC functions to see other participants)
CREATE POLICY "participants_select_policy" ON public.conversation_participants
    FOR SELECT USING (user_id = auth.uid());

-- INSERT: Authenticated users can add participants
CREATE POLICY "participants_insert_policy" ON public.conversation_participants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can update their own record (last_read_at)
CREATE POLICY "participants_update_policy" ON public.conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

-- DELETE: Users can remove themselves from conversations
CREATE POLICY "participants_delete_policy" ON public.conversation_participants
    FOR DELETE USING (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- MESSAGES TABLE
-- ───────────────────────────────────────────────────────────────────────────

-- SELECT: Users can view messages in their conversations
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- INSERT: Users can send messages to their conversations
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- UPDATE: Users can edit their own messages
CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid());

-- DELETE: Users can delete their own messages
CREATE POLICY "messages_delete_policy" ON public.messages
    FOR DELETE USING (sender_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: CREATE RPC FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- These are used by BOTH Android App AND Coach Desktop
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- FUNCTION: find_or_create_conversation
-- Used by: Coach Desktop (when clicking "Message" on a client)
-- Used by: Android App (when opening coach chat)
-- Parameter: target_user_id (consistent naming for both apps)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION find_or_create_conversation(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    existing_conv_id UUID;
    new_conv_id UUID;
BEGIN
    -- Input validation
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'target_user_id is required';
    END IF;

    IF current_user_id = target_user_id THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself';
    END IF;

    -- Find existing conversation between these two users
    SELECT cp1.conversation_id INTO existing_conv_id
    FROM conversation_participants cp1
    INNER JOIN conversation_participants cp2
        ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = current_user_id
    AND cp2.user_id = target_user_id
    LIMIT 1;

    -- Return existing conversation if found
    IF existing_conv_id IS NOT NULL THEN
        -- Update timestamp to bring it to top
        UPDATE conversations SET updated_at = NOW() WHERE id = existing_conv_id;
        RETURN existing_conv_id;
    END IF;

    -- Create new conversation
    new_conv_id := gen_random_uuid();

    INSERT INTO conversations (id, created_at, updated_at)
    VALUES (new_conv_id, NOW(), NOW());

    -- Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
    VALUES
        (new_conv_id, current_user_id, 'member', NOW()),
        (new_conv_id, target_user_id, 'member', NOW());

    RETURN new_conv_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- FUNCTION: find_shared_conversation
-- Used by: Coach Desktop (to check if conversation exists)
-- Used by: Android App (to find existing conversation with coach)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION find_shared_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    found_conv_id UUID;
BEGIN
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT cp1.conversation_id INTO found_conv_id
    FROM conversation_participants cp1
    INNER JOIN conversation_participants cp2
        ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = current_user_id
    AND cp2.user_id = other_user_id
    LIMIT 1;

    RETURN found_conv_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_other_participant
-- Used by: Coach Desktop (to show who you're chatting with)
-- Used by: Android App (to show coach info)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_other_participant(conv_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Security check: caller must be participant
    IF NOT EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conv_id AND user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        p.id as user_id,
        p.full_name,
        p.avatar_url,
        p.email
    FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.user_id
    WHERE cp.conversation_id = conv_id
    AND cp.user_id != auth.uid()
    LIMIT 1;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_conversation_participants
-- Used by: Both apps to see all participants in a conversation
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_conversation_participants(conv_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Security check: caller must be participant
    IF NOT EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conv_id AND user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        cp.user_id,
        p.full_name,
        p.avatar_url,
        cp.role::TEXT,
        cp.joined_at,
        cp.last_read_at
    FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.user_id
    WHERE cp.conversation_id = conv_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_user_conversations
-- Used by: Coach Desktop (Inbox sidebar)
-- Returns all conversations with last message and unread count
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_conversations()
RETURNS TABLE (
    conversation_id UUID,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_avatar TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_sender_id UUID,
    unread_count BIGINT,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH my_conversations AS (
        SELECT cp.conversation_id, cp.last_read_at
        FROM conversation_participants cp
        WHERE cp.user_id = current_user_id
    ),
    other_participants AS (
        SELECT
            cp.conversation_id,
            cp.user_id as other_user_id,
            p.full_name as other_user_name,
            p.avatar_url as other_user_avatar
        FROM conversation_participants cp
        JOIN profiles p ON p.id = cp.user_id
        WHERE cp.conversation_id IN (SELECT conversation_id FROM my_conversations)
        AND cp.user_id != current_user_id
    ),
    last_messages AS (
        SELECT DISTINCT ON (m.conversation_id)
            m.conversation_id,
            m.content as last_message_content,
            m.created_at as last_message_at,
            m.sender_id as last_message_sender_id
        FROM messages m
        WHERE m.conversation_id IN (SELECT conversation_id FROM my_conversations)
        ORDER BY m.conversation_id, m.created_at DESC
    ),
    unread_counts AS (
        SELECT
            m.conversation_id,
            COUNT(*) as unread_count
        FROM messages m
        JOIN my_conversations mc ON m.conversation_id = mc.conversation_id
        WHERE m.sender_id != current_user_id
        AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
        GROUP BY m.conversation_id
    )
    SELECT
        c.id as conversation_id,
        op.other_user_id,
        op.other_user_name,
        op.other_user_avatar,
        lm.last_message_content,
        lm.last_message_at,
        lm.last_message_sender_id,
        COALESCE(uc.unread_count, 0) as unread_count,
        c.updated_at
    FROM conversations c
    JOIN my_conversations mc ON c.id = mc.conversation_id
    LEFT JOIN other_participants op ON c.id = op.conversation_id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id
    LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
    ORDER BY COALESCE(lm.last_message_at, c.updated_at) DESC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 6: GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION find_or_create_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_shared_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_other_participant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 7: ENABLE REALTIME
-- ═══════════════════════════════════════════════════════════════════════════

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- Enable replica identity for realtime updates
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE conversation_participants REPLICA IDENTITY FULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 8: VERIFY EVERYTHING
-- ═══════════════════════════════════════════════════════════════════════════

-- Show created policies
SELECT '=== RLS POLICIES ===' as info;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;

-- Show created functions
SELECT '=== RPC FUNCTIONS ===' as info;
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'find_or_create_conversation',
    'find_shared_conversation',
    'get_other_participant',
    'get_conversation_participants',
    'get_user_conversations'
);

-- Show realtime tables
SELECT '=== REALTIME TABLES ===' as info;
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'conversations', 'conversation_participants');

SELECT '✅ CHAT SYSTEM FIX COMPLETE!' as status;